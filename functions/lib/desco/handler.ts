interface Env { DESCO_SESSION_KEY: string; WATCH_ASSERTION_KEY?: string }
interface Session { cookies: Record<string, string>; expires: number }
const COOKIE = '__Host-descowise-session';
const BASE = 'https://prepaid.desco.org.bd/api';
const MAX_AGE = 60 * 60 * 12;
const encoder = new TextEncoder();
const clear = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
async function watchAssertion(payload: object, secret: string) {
 const segment = b64(encoder.encode(JSON.stringify(payload)));
 const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
 const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(segment));
 return `${segment}.${b64(new Uint8Array(signature))}`;
}
const unb64 = (value: string) => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
async function key(secret: string) {
 let bytes = encoder.encode(secret || '');
 if (bytes.length !== 32) { try { bytes = unb64(secret); } catch { throw new Error('configuration'); } }
 if (bytes.length !== 32) throw new Error('configuration');
 return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(session: Session, encryptionKey: CryptoKey) {
 const iv = crypto.getRandomValues(new Uint8Array(12));
 const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(COOKIE) }, encryptionKey, encoder.encode(JSON.stringify(session)));
 return `${b64(iv)}.${b64(new Uint8Array(data))}`;
}
async function open(request: Request, encryptionKey: CryptoKey): Promise<Session | null> {
 const raw = request.headers.get('Cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
 if (!raw) return null;
 try {
 const [iv, data] = raw.split('.');
 const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: encoder.encode(COOKIE) }, encryptionKey, unb64(data));
 const session: Session = JSON.parse(new TextDecoder().decode(decoded));
 return session.expires > Date.now() && typeof session.cookies?.DESCO_SESSION === 'string' && typeof session.cookies?.['XSRF-TOKEN'] === 'string' ? session : null;
 } catch { return null; }
}
function response(data: unknown, status = 200, cookie?: string) {
 return new Response(status === 204 ? null : JSON.stringify(data), {status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...(cookie ? {'Set-Cookie':cookie} : {})}});
}
function receiveCookies(headers: Headers, jar: Record<string,string>) {
 // getSetCookie is supported by Workers and modern test runtimes; fallback handles a combined header.
 const values = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie') || ''];
 for (const value of values) for (const match of value.matchAll(/(?:^|,\s*)(XSRF-TOKEN|DESCO_SESSION)=([^; ,]*)/g)) jar[match[1]] = match[2];
}
async function upstream(path: string, method: string, jar: Record<string,string>, body?: unknown) {
 const headers = new Headers({ Accept:'application/json' });
 if (Object.keys(jar).length) headers.set('Cookie', Object.entries(jar).map(([k,v]) => `${k}=${v}`).join('; '));
 if (method !== 'GET') { headers.set('X-XSRF-TOKEN', decodeURIComponent(jar['XSRF-TOKEN'] || '')); headers.set('Content-Type','application/json'); }
 const result = await fetch(new Request(`${BASE}${path}`, {method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect:'manual', signal: AbortSignal.timeout(20000)}));
 receiveCookies(result.headers, jar);
 return result;
}
const routes: Record<string,string[]> = {
 balance:[], summary:[], 'usage/daily':['dateFrom','dateTo'], 'usage/monthly':['monthFrom','monthTo'], transactions:['dateFrom','dateTo'], tokens:['dateFrom','dateTo'], 'consumption-comparison':['year','endMonth'], 'energy-vs-consumed-taka':['monthFrom','monthTo'], 'contact-office':[], 'token-resend/eligibility':[],
};
export async function handleDesco(request: Request, env: Env): Promise<Response> {
 const url = new URL(request.url);
 const path = url.pathname.replace(/^\/api\/desco\/?/, '');
 const method = request.method;
 if (method !== 'GET' && request.headers.get('Origin') !== url.origin) return response({error:'INVALID_ORIGIN'},403);
 const account = path.match(/^accounts\/([1-9]\d*)\/(.+)$/);
 const allowed = (path === 'login' && method === 'POST') || (path === 'logout' && method === 'POST') || (path === 'session' && method === 'GET') || (path === 'watch-assertions' && method === 'POST') || (['accounts','accounts/realtime-balance'].includes(path) && method === 'GET') || (path === 'accounts/link' && method === 'POST') || (account && ((account[2] === 'link' && method === 'DELETE') || (Object.hasOwn(routes,account[2]) && method === 'GET')));
 if (!allowed) return response({error:'NOT_FOUND'},404);
 try {
 const encryptionKey = await key(env.DESCO_SESSION_KEY);
 let session = await open(request,encryptionKey);
 if (path === 'session' && !session) return response({authenticated:false},200,clear);
 if (path !== 'login' && !session) return response({error:'AUTHENTICATION_REQUIRED'},401,clear);
 let body: Record<string,unknown> | undefined;
 if (method === 'POST' && path !== 'logout') {
 if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return response({error:'JSON_REQUIRED'},415);
 if (Number(request.headers.get('Content-Length')) > 4096) return response({error:'BODY_TOO_LARGE'},413);
 const raw = await request.text(); if (raw.length > 4096) return response({error:'BODY_TOO_LARGE'},413);
 try { body = JSON.parse(raw); } catch { return response({error:'INVALID_JSON'},400); }
 if (path === 'watch-assertions') {
  if (!body || !Array.isArray(body.accountNos) || body.accountNos.length > 50 || body.accountNos.some((value: unknown) => typeof value !== 'string' || !/^\d{5,30}$/.test(value))) return response({error:'INVALID_INPUT'},400);
 } else {
  const names = path === 'login' ? ['username','password'] : ['accountNo','meterNo'];
  if (!body || names.some(name => typeof body![name] !== 'string' || !(body![name] as string).trim() || (body![name] as string).length > 512)) return response({error:'INVALID_INPUT'},400);
  body = Object.fromEntries(names.map(name=>[name,body![name]]));
 }
 }
 if (path === 'login') {
 session = {cookies:{},expires:Date.now()+MAX_AGE*1000};
 const csrf = await upstream('/auth/csrf','GET',session.cookies);
 if (!csrf.ok || !session.cookies['XSRF-TOKEN']) return response({error:'UPSTREAM_UNAVAILABLE'},502,clear);
 }
 const active = session!;
 if (path === 'watch-assertions') {
  if (!env.WATCH_ASSERTION_KEY || env.WATCH_ASSERTION_KEY.length < 32) return response({error:'SERVICE_UNAVAILABLE'},503);
  const identity = await upstream('/auth/session','GET',active.cookies);
  if (identity.status === 401) return response({error:'AUTHENTICATION_REQUIRED'},401,clear);
  if (!identity.ok) return response({error:'UPSTREAM_UNAVAILABLE'},502);
  const profile = await identity.json() as {authenticated?: boolean; userId?: string | number};
  if (!profile.authenticated || !/^[\w-]{1,128}$/.test(String(profile.userId ?? ''))) return response({error:'AUTHENTICATION_REQUIRED'},401,clear);
  const linked = await upstream('/accounts','GET',active.cookies);
  if (linked.status === 401) return response({error:'AUTHENTICATION_REQUIRED'},401,clear);
  if (!linked.ok) return response({error:'UPSTREAM_UNAVAILABLE'},502);
  const list = await linked.json() as {accounts?: Array<{accountId: number; accountNo: string}>};
  const accounts = new Map((list.accounts || []).map(item => [item.accountNo, item.accountId]));
  const assertions: Record<string,string> = {};
  for (const accountNo of body!.accountNos as string[]) {
   const accountId = accounts.get(accountNo);
   if (!Number.isSafeInteger(accountId) || accountId! <= 0) return response({error:'ACCOUNT_NOT_LINKED'},403);
   assertions[accountNo] = await watchAssertion({aud:'descowise-watch',ownerId:String(profile.userId),accountId,accountNo,exp:Math.floor(Date.now()/1000)+300},env.WATCH_ASSERTION_KEY);
  }
  return response({assertions});
 }
 const upstreamPath = ['login','session','logout'].includes(path) ? `/auth/${path}` : `/${path}`;
 const query = new URLSearchParams();
 for (const name of account ? routes[account[2]] || [] : []) {
 const value = url.searchParams.get(name); if (value === null) continue;
 const pattern = name.includes('date') ? /^\d{4}-\d{2}-\d{2}$/ : name.includes('month') ? /^\d{4}-\d{2}$/ : /^\d{1,4}$/;
 if (!pattern.test(value)) return response({error:'INVALID_QUERY'},400);
 query.set(name,value);
 }
 const result = await upstream(upstreamPath + (query.size ? `?${query}` : ''),method,active.cookies,body);
 if (path === 'logout') return response(null,204,clear);
 if (result.status === 401) return response({error:'AUTHENTICATION_REQUIRED'},401,clear);
 if (result.status >= 300 && result.status < 400) return response({error:'UPSTREAM_UNAVAILABLE'},502);
 if (path === 'login' && result.ok && !active.cookies.DESCO_SESSION) return response({error:'UPSTREAM_UNAVAILABLE'},502,clear);
 let data: unknown = null;
 if(result.status !== 204) { try { data = await result.json(); } catch { return response({error:'UPSTREAM_INVALID_RESPONSE'},502); } }
 if (path === 'session' && data && typeof data === 'object' && 'authenticated' in data && data.authenticated === false) return response(data,result.status,clear);
 const cookie = result.ok ? `${COOKIE}=${await seal(active,encryptionKey)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0,Math.floor((active.expires-Date.now())/1000))}` : path === 'login' ? clear : undefined;
 return response(data,result.status,cookie);
 } catch { return response({error:'SERVICE_UNAVAILABLE'},503); }
}
