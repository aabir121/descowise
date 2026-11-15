import { beforeEach, expect, it, vi } from 'vitest';
import { handleDesco } from './handler';
const env = { DESCO_SESSION_KEY: '12345678901234567890123456789012' };
const request = (path: string, method = 'GET', body?: object, cookie?: string) => new Request(`https://app.example/api/desco/${path}`, { method, headers: { Origin: 'https://app.example', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
beforeEach(() => vi.restoreAllMocks());
it('rejects cross-origin mutations before contacting DESCO', async () => {
 const res = await handleDesco(new Request('https://app.example/api/desco/login', {method:'POST',headers:{Origin:'https://evil.example'}}), env);
 expect(res.status).toBe(403);
});
it('authenticates with CSRF, seals cookies and forwards only allowed requests', async () => {
 const calls: Request[] = [];
 vi.stubGlobal('fetch', vi.fn(async (input: Request) => { calls.push(input); const path = new URL(input.url).pathname;
 if(path.endsWith('/csrf')) return new Response(null,{status:204,headers:{'Set-Cookie':'XSRF-TOKEN=csrf%3Dtoken; Path=/'}});
 if(path.endsWith('/login')) return new Response('{}',{headers:{'Set-Cookie':'DESCO_SESSION=secret-session; Path=/'}});
 return Response.json({accounts:[]}); }));
 const login = await handleDesco(request('login','POST',{username:'user',password:'password'}),env);
 expect(login.status).toBe(200);
 const sealed = login.headers.get('set-cookie')!;
 expect(sealed).toContain('HttpOnly; Secure; SameSite=Lax');
 expect(sealed).not.toContain('secret-session'); expect(sealed).not.toContain('password');
 expect(calls[1].headers.get('X-XSRF-TOKEN')).toBe('csrf=token');
 const response = await handleDesco(request('accounts','GET',undefined,sealed.split(';')[0]),env);
 expect(response.status).toBe(200); expect(calls[2].headers.get('Cookie')).toContain('DESCO_SESSION=secret-session');
 expect((await handleDesco(request('profile','GET',undefined,sealed.split(';')[0]),env)).status).toBe(404);
});
it('clears an invalid or expired authenticated session', async () => {
 const response = await handleDesco(request('accounts','GET',undefined,'__Host-descowise-session=tampered'),env);
 expect(response.status).toBe(401); expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
});
it('clears sessions on DESCO 401 and keeps DESCO cookies out of browser responses', async () => {
 vi.stubGlobal('fetch', vi.fn(async (input: Request) => {
 const path = new URL(input.url).pathname;
 if(path.endsWith('/csrf')) return new Response(null,{status:204,headers:{'Set-Cookie':'XSRF-TOKEN=csrf; Path=/'}});
 if(path.endsWith('/login')) return Response.json({authenticated:true},{headers:{'Set-Cookie':'DESCO_SESSION=upstream-secret; Path=/'}});
 return Response.json({error:'AUTHENTICATION_REQUIRED'},{status:401});
 }));
 const login = await handleDesco(request('login','POST',{username:'user',password:'password'}),env);
 const result = await handleDesco(request('accounts/42/balance','GET',undefined,login.headers.get('set-cookie')!.split(';')[0]),env);
 expect(result.status).toBe(401); expect(result.headers.get('set-cookie')).toContain('Max-Age=0');
 expect(result.headers.get('set-cookie')).not.toContain('upstream-secret');
});
it('fails closed when the required encryption key is missing', async () => {
 expect((await handleDesco(request('session'),{DESCO_SESSION_KEY:''})).status).toBe(503);
});
it('does not accept arbitrary proxy paths or methods', async () => {
 expect((await handleDesco(request('accounts/1/token-resend','POST',{meterNos:['x']}),env)).status).toBe(404);
 expect((await handleDesco(request('accounts/1/realtime-balance','POST',{}),env)).status).toBe(404);
 expect((await handleDesco(request('accounts/1/balance/../../profile'),env)).status).toBe(404);
});
it('forwards only approved query fields and uses account IDs with upstream authorization', async () => {
 const calls: Request[]=[];
 vi.stubGlobal('fetch',vi.fn(async (input: Request)=>{
 calls.push(input);const path=new URL(input.url).pathname;
 if(path.endsWith('/csrf'))return new Response(null,{status:204,headers:{'Set-Cookie':'XSRF-TOKEN=csrf; Path=/'}});
 if(path.endsWith('/login'))return Response.json({authenticated:true},{headers:{'Set-Cookie':'DESCO_SESSION=secret; Path=/'}});
 return Response.json({records:[]});
 }));
 const login=await handleDesco(request('login','POST',{username:'user',password:'password'}),env);
 const cookie=login.headers.get('set-cookie')!.split(';')[0];
 const result=await handleDesco(request('accounts/42/usage/daily?dateFrom=2026-11-01&dateTo=2026-11-14&target=https://evil.example','GET',undefined,cookie),env);
 expect(result.status).toBe(200);
 expect(calls[2].url).toBe('https://prepaid.desco.org.bd/api/accounts/42/usage/daily?dateFrom=2026-11-01&dateTo=2026-11-14');
 expect((await handleDesco(request('accounts/42/usage/daily?dateFrom=bad','GET',undefined,cookie),env)).status).toBe(400);
});
it('clears a session when DESCO reports authenticated false with HTTP 200', async () => {
 vi.stubGlobal('fetch',vi.fn(async(input:Request)=>{
 const path=new URL(input.url).pathname;
 if(path.endsWith('/csrf')) return new Response(null,{status:204,headers:{'Set-Cookie':'XSRF-TOKEN=csrf; Path=/'}});
 if(path.endsWith('/login')) return Response.json({authenticated:true},{headers:{'Set-Cookie':'DESCO_SESSION=secret; Path=/'}});
 return Response.json({authenticated:false});
 }));
 const login=await handleDesco(request('login','POST',{username:'user',password:'password'}),env);
 const result=await handleDesco(request('session','GET',undefined,login.headers.get('set-cookie')!.split(';')[0]),env);
 expect(await result.json()).toEqual({authenticated:false});
 expect(result.headers.get('set-cookie')).toContain('Max-Age=0');
});
it('restores a valid signed-in session on a later app visit', async () => {
 vi.stubGlobal('fetch',vi.fn(async(input:Request)=>{
  const path=new URL(input.url).pathname;
  if(path.endsWith('/csrf')) return new Response(null,{status:204,headers:{'Set-Cookie':'XSRF-TOKEN=csrf; Path=/'}});
  if(path.endsWith('/login')) return Response.json({authenticated:true},{headers:{'Set-Cookie':'DESCO_SESSION=secret; Path=/'}});
  return Response.json({authenticated:true});
 }));
 const login=await handleDesco(request('login','POST',{username:'user',password:'password'}),env);
 const cookie=login.headers.get('set-cookie')!;
 expect(cookie).toMatch(/Max-Age=43\d{3}/);
 const later=await handleDesco(request('session','GET',undefined,cookie.split(';')[0]),env);
 expect(await later.json()).toEqual({authenticated:true});
 expect(later.headers.get('set-cookie')).toContain('__Host-descowise-session=');
});
it('mints watch assertions only for accounts linked to the signed-in DESCO identity', async () => {
 const scopedEnv = { ...env, WATCH_ASSERTION_KEY: 'watch-assertion-key-at-least-32-characters' };
 vi.stubGlobal('fetch', vi.fn(async (input: Request) => {
  const path = new URL(input.url).pathname;
  if (path.endsWith('/csrf')) return new Response(null, {status:204,headers:{'Set-Cookie':'XSRF-TOKEN=csrf; Path=/'} });
  if (path.endsWith('/login')) return Response.json({authenticated:true}, {headers:{'Set-Cookie':'DESCO_SESSION=secret; Path=/'} });
  if (path.endsWith('/session')) return Response.json({authenticated:true,userId:77});
  return Response.json({accounts:[{accountId:38118,accountNo:'41348746'}]});
 }));
 const login = await handleDesco(request('login','POST',{username:'owner',password:'password'}), scopedEnv);
 const cookie = login.headers.get('set-cookie')!.split(';')[0];
 const denied = await handleDesco(request('watch-assertions','POST',{accountNos:['99999999']},cookie), scopedEnv);
 expect(denied.status).toBe(403);
 const result = await handleDesco(request('watch-assertions','POST',{accountNos:['41348746']},cookie), scopedEnv);
 expect(result.status).toBe(200);
 const assertions = (await result.json()).assertions;
 expect(typeof assertions['41348746']).toBe('string');
 const payload = JSON.parse(atob(assertions['41348746'].split('.')[0].replace(/-/g,'+').replace(/_/g,'/')));
 expect(payload).toMatchObject({aud:'descowise-watch',ownerId:'77',accountId:38118,accountNo:'41348746'});
});
