import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push';
import { nextSendAt, retryAt, validLocalTime, validTimezone } from './schedule';

interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

interface SubscriptionInput {
  subscription: PushSubscription;
  timezone: string;
  locale?: string;
  deviceId: string;
  deviceSecret: string;
}

interface ReminderInput {
  id?: string;
  title: string;
  body: string;
  localTime: string;
  timezone: string;
  targetUrl?: string;
  iconUrl?: string;
  badgeUrl?: string;
  enabled: boolean;
}
interface AccountWatchInput { accountNo: string; label?: string; enabled: boolean; thresholdBdt?: number; }
type AccountWatch = { account_no: string; label: string | null; threshold_bdt: number; };

type StoredReminder = {
  id: string; device_id: string; subscription_id: string; title: string; body: string;
  target_url: string; icon_url: string | null; badge_url: string | null;
  scheduled_local_time: string; timezone: string; enabled: number; next_send_at: string;
  attempt_count: number;
};

const json = (body: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
});
const nowIso = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function log(event: string, fields: Record<string, unknown> = {}) {
  // Deliberately only structured identifiers/statuses, never subscription keys or notification content.
  console.log(JSON.stringify({ event, ...fields }));
}

function cors(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin');
  return origin === env.ALLOWED_ORIGIN ? {
    'access-control-allow-origin': env.ALLOWED_ORIGIN,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-device-secret',
    'vary': 'Origin',
  } : {};
}

function requestAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  return !origin || origin === env.ALLOWED_ORIGIN;
}

async function body<T>(request: Request): Promise<T> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 16_384) throw new Error('Request is too large');
  const text = await request.text();
  if (text.length > 16_384) throw new Error('Request is too large');
  return JSON.parse(text) as T;
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function limited(env: Env, key: string, maximum: number): Promise<boolean> {
  const bucket = `${key}:${new Date().toISOString().slice(0, 13)}`;
  const result = await env.DB.prepare(
    'INSERT INTO rate_limits(bucket, count, reset_at) VALUES(?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count = count + 1 RETURNING count',
  ).bind(bucket, new Date(Date.now() + 3_600_000).toISOString()).first<{ count: number }>();
  return (result?.count ?? maximum + 1) <= maximum;
}

function validTargetUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 512 && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
}

function validSubscription(value: unknown): value is PushSubscription {
  const sub = value as PushSubscription | undefined;
  return !!sub && typeof sub.endpoint === 'string' && sub.endpoint.length <= 2048 && /^https:\/\//.test(sub.endpoint)
    && !!sub.keys && typeof sub.keys.p256dh === 'string' && sub.keys.p256dh.length > 20
    && typeof sub.keys.auth === 'string' && sub.keys.auth.length > 8;
}

async function requireDevice(request: Request, env: Env, deviceId: string) {
  const secret = request.headers.get('x-device-secret');
  if (!secret || secret.length < 32 || secret.length > 256) return null;
  const stored = await env.DB.prepare('SELECT id, device_secret_hash FROM push_subscriptions WHERE device_id = ? AND enabled = 1 ORDER BY updated_at DESC LIMIT 1').bind(deviceId).first<{ id: string; device_secret_hash: string }>();
  return stored && (await hash(secret)) === stored.device_secret_hash ? stored : null;
}

async function subscribe(request: Request, env: Env) {
  const input = await body<SubscriptionInput>(request);
  if (!validSubscription(input.subscription) || !validTimezone(input.timezone) || typeof input.deviceId !== 'string' || !/^[\w-]{16,128}$/.test(input.deviceId)
    || typeof input.deviceSecret !== 'string' || input.deviceSecret.length < 32 || input.deviceSecret.length > 256) {
    return json({ error: 'Invalid subscription request' }, 400);
  }
  const timestamp = nowIso();
  const subscriptionId = id();
  const secretHash = await hash(input.deviceSecret);
  await env.DB.prepare(`INSERT INTO push_subscriptions
    (id, device_id, device_secret_hash, endpoint, p256dh, auth, timezone, locale, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET device_id=excluded.device_id, device_secret_hash=excluded.device_secret_hash,
      p256dh=excluded.p256dh, auth=excluded.auth, timezone=excluded.timezone, locale=excluded.locale, enabled=1, updated_at=excluded.updated_at`
  ).bind(subscriptionId, input.deviceId, secretHash, input.subscription.endpoint, input.subscription.keys.p256dh, input.subscription.keys.auth,
    input.timezone, typeof input.locale === 'string' ? input.locale.slice(0, 35) : null, timestamp, timestamp).run();
  const stored = await env.DB.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?').bind(input.subscription.endpoint).first<{ id: string }>();
  if (stored) await env.DB.prepare('UPDATE reminders SET subscription_id = ?, updated_at = ? WHERE device_id = ?').bind(stored.id, timestamp, input.deviceId).run();
  log('subscription_upserted', { subscriptionId: stored?.id, deviceId: input.deviceId });
  return json({ subscriptionId: stored?.id });
}

function parseReminder(input: ReminderInput): string | null {
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 120 || typeof input.body !== 'string' || input.body.length > 500
    || !validLocalTime(input.localTime) || !validTimezone(input.timezone) || typeof input.enabled !== 'boolean'
    || (input.targetUrl !== undefined && !validTargetUrl(input.targetUrl))) return 'Invalid reminder';
  return null;
}

async function saveReminder(request: Request, env: Env, reminderId?: string) {
  const input = await body<ReminderInput & { deviceId: string }>(request);
  const auth = await requireDevice(request, env, input.deviceId);
  if (!auth) return json({ error: 'Unauthorized device' }, 401);
  const error = parseReminder(input); if (error) return json({ error }, 400);
  const subscription = await env.DB.prepare('SELECT id FROM push_subscriptions WHERE id = ? AND device_id = ? AND enabled = 1').bind(auth.id, input.deviceId).first<{ id: string }>();
  if (!subscription) return json({ error: 'No active subscription' }, 409);
  const timestamp = nowIso(); const reminder = reminderId ?? input.id ?? id();
  if (!/^[\w-]{1,128}$/.test(reminder)) return json({ error: 'Invalid reminder id' }, 400);
  const next = input.enabled ? nextSendAt(input.localTime, input.timezone) : '9999-12-31T00:00:00.000Z';
  if (reminderId) {
    const changed = await env.DB.prepare(`UPDATE reminders SET title=?, body=?, target_url=?, icon_url=?, badge_url=?, scheduled_local_time=?, timezone=?, enabled=?, next_send_at=?, attempt_count=0, processing_token=NULL, processing_started_at=NULL, updated_at=? WHERE id=? AND device_id=?`).bind(
      input.title.trim(), input.body.trim(), input.targetUrl ?? '/', input.iconUrl ?? null, input.badgeUrl ?? null, input.localTime, input.timezone, Number(input.enabled), next, timestamp, reminder, input.deviceId).run();
    if (!changed.meta.changes) return json({ error: 'Reminder not found' }, 404);
    log('reminder_updated', { reminderId: reminder, deviceId: input.deviceId });
  } else {
    await env.DB.prepare(`INSERT INTO reminders (id, device_id, subscription_id, title, body, target_url, icon_url, badge_url, scheduled_local_time, timezone, enabled, next_send_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(reminder, input.deviceId, subscription.id, input.title.trim(), input.body.trim(), input.targetUrl ?? '/', input.iconUrl ?? null, input.badgeUrl ?? null, input.localTime, input.timezone, Number(input.enabled), next, timestamp, timestamp).run();
    log('reminder_created', { reminderId: reminder, deviceId: input.deviceId });
  }
  return json({ id: reminder, nextSendAt: next }, reminderId ? 200 : 201);
}

async function deleteReminder(request: Request, env: Env, reminderId: string) {
  const deviceId = new URL(request.url).searchParams.get('deviceId') ?? '';
  const auth = await requireDevice(request, env, deviceId); if (!auth) return json({ error: 'Unauthorized device' }, 401);
  await env.DB.prepare('DELETE FROM reminders WHERE id = ? AND device_id = ?').bind(reminderId, deviceId).run();
  return new Response(null, { status: 204 });
}

async function listReminders(request: Request, env: Env) {
  const deviceId = new URL(request.url).searchParams.get('deviceId') ?? '';
  const auth = await requireDevice(request, env, deviceId); if (!auth) return json({ error: 'Unauthorized device' }, 401);
  const records = await env.DB.prepare('SELECT id, title, target_url AS targetUrl, scheduled_local_time AS localTime, timezone, enabled, next_send_at AS nextSendAt, last_sent_at AS lastSentAt FROM reminders WHERE device_id = ? ORDER BY created_at').bind(deviceId).all();
  return json({ reminders: records.results });
}

async function saveAccountWatches(request: Request, env: Env) {
  const input = await body<{ deviceId: string; globalThresholdBdt: number; accounts: AccountWatchInput[] }>(request);
  const auth = await requireDevice(request, env, input.deviceId); if (!auth) return json({ error: 'Unauthorized device' }, 401);
  if (!Number.isFinite(input.globalThresholdBdt) || input.globalThresholdBdt < 0 || input.globalThresholdBdt > 1_000_000 || !Array.isArray(input.accounts) || input.accounts.length > 50) return json({ error: 'Invalid account watch rules' }, 400);
  const accounts = new Map<string, AccountWatchInput>();
  for (const account of input.accounts) {
    if (!/^\d{5,30}$/.test(account.accountNo) || typeof account.enabled !== 'boolean' || (account.thresholdBdt !== undefined && (!Number.isFinite(account.thresholdBdt) || account.thresholdBdt < 0 || account.thresholdBdt > 1_000_000))) return json({ error: 'Invalid account watch rule' }, 400);
    accounts.set(account.accountNo, account); // deduplicates incoming account numbers deterministically
  }
  const timestamp = nowIso();
  const statements: D1PreparedStatement[] = [env.DB.prepare('DELETE FROM account_watch_rules WHERE device_id = ?').bind(input.deviceId)];
  for (const account of accounts.values()) statements.push(env.DB.prepare('INSERT INTO account_watch_rules (id, device_id, account_no, label, enabled, threshold_bdt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id(), input.deviceId, account.accountNo, account.label?.slice(0, 80) ?? null, Number(account.enabled), account.thresholdBdt ?? input.globalThresholdBdt, timestamp, timestamp));
  await env.DB.batch(statements);
  log('account_watches_synced', { deviceId: input.deviceId, accountCount: accounts.size });
  return json({ accountCount: accounts.size });
}

async function belowThresholdAccounts(env: Env, deviceId: string, cache: Map<string, Promise<number | null>>): Promise<AccountWatch[]> {
  const rules = await env.DB.prepare('SELECT account_no, label, threshold_bdt FROM account_watch_rules WHERE device_id=? AND enabled=1').bind(deviceId).all<AccountWatch>();
  const low: AccountWatch[] = [];
  for (const rule of rules.results) {
    let balance = cache.get(rule.account_no);
    if (!balance) {
      balance = fetch(`https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=${encodeURIComponent(rule.account_no)}`, { headers: { accept: 'application/json' } })
        .then(async response => { const data = await response.json() as { code?: number; data?: { balance?: unknown } }; const value = Number(data.data?.balance); return response.ok && data.code === 200 && Number.isFinite(value) ? value : null; })
        .catch(() => null);
      cache.set(rule.account_no, balance);
    }
    const value = await balance;
    await env.DB.prepare('UPDATE account_watch_rules SET last_balance=?, last_checked_at=?, updated_at=? WHERE device_id=? AND account_no=?').bind(value, nowIso(), nowIso(), deviceId, rule.account_no).run();
    if (value !== null && value < rule.threshold_bdt) low.push(rule);
  }
  return low;
}

async function testPush(request: Request, env: Env) {
  const input = await body<{ deviceId: string }>(request);
  const auth = await requireDevice(request, env, input.deviceId); if (!auth) return json({ error: 'Unauthorized device' }, 401);
  if (!(await limited(env, `test:${input.deviceId}`, 5))) return json({ error: 'Too many test notifications' }, 429);
  const sub = await env.DB.prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE id = ? AND enabled = 1').bind(auth.id).first<{ id: string; endpoint: string; p256dh: string; auth: string }>();
  if (!sub) return json({ error: 'Subscription expired' }, 410);
  const result = await sendPush(env, sub, { title: 'DescoWise test', body: 'Background push is configured. You can close the app and still receive scheduled reminders.', targetUrl: '/' });
  if (result.invalid) await removeSubscription(env, sub.id, result.status);
  return result.ok ? json({ sent: true }) : json({ error: 'Test notification failed' }, 502);
}

async function unsubscribe(request: Request, env: Env) {
  const deviceId = new URL(request.url).searchParams.get('deviceId') ?? '';
  const auth = await requireDevice(request, env, deviceId);
  if (!auth) return json({ error: 'Unauthorized device' }, 401);
  await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ? AND device_id = ?').bind(auth.id, deviceId).run();
  log('subscription_removed', { subscriptionId: auth.id, deviceId });
  return new Response(null, { status: 204 });
}

async function sendPush(env: Env, sub: { endpoint: string; p256dh: string; auth: string }, payload: { title: string; body: string; targetUrl: string; iconUrl?: string | null; badgeUrl?: string | null; reminderId?: string }) {
  const request = await buildPushPayload({ data: JSON.stringify({ title: payload.title, body: payload.body, icon: payload.iconUrl ?? '/icon-192x192.png', badge: payload.badgeUrl ?? '/icon-192x192.png', tag: payload.reminderId ? `reminder-${payload.reminderId}` : 'push-test', data: { url: payload.targetUrl, reminderId: payload.reminderId } }), options: { ttl: 86_400, urgency: 'normal' } },
    { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT });
  const response = await fetch(sub.endpoint, request);
  return { ok: response.ok, status: response.status, invalid: response.status === 404 || response.status === 410 };
}

async function removeSubscription(env: Env, subscriptionId: string, status: number) {
  await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(subscriptionId).run();
  log('subscription_expired', { subscriptionId, status });
}

async function runCron(env: Env) {
  const now = nowIso(); log('cron_started');
  await env.DB.prepare("UPDATE reminders SET processing_token=NULL, processing_started_at=NULL WHERE processing_started_at < datetime('now', '-15 minutes')").run();
  const due = await env.DB.prepare('SELECT * FROM reminders WHERE enabled = 1 AND next_send_at <= ? AND processing_token IS NULL LIMIT 100').bind(now).all<StoredReminder>();
  log('due_reminder_count', { count: due.results.length });
  const balanceCache = new Map<string, Promise<number | null>>();
  for (const reminder of due.results) {
    const token = id();
    const claim = await env.DB.prepare('UPDATE reminders SET processing_token=?, processing_started_at=? WHERE id=? AND processing_token IS NULL AND enabled=1 AND next_send_at <= ?').bind(token, now, reminder.id, now).run();
    if (!claim.meta.changes) continue;
    const sub = await env.DB.prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE id=? AND enabled=1').bind(reminder.subscription_id).first<{ id: string; endpoint: string; p256dh: string; auth: string }>();
    if (!sub) { await env.DB.prepare('UPDATE reminders SET enabled=0, processing_token=NULL, processing_started_at=NULL, updated_at=? WHERE id=? AND processing_token=?').bind(nowIso(), reminder.id, token).run(); continue; }
    try {
      const lowAccounts = await belowThresholdAccounts(env, reminder.device_id, balanceCache);
      const next = nextSendAt(reminder.scheduled_local_time, reminder.timezone);
      if (lowAccounts.length === 0) {
        await env.DB.prepare('UPDATE reminders SET last_sent_at=?, next_send_at=?, attempt_count=0, processing_token=NULL, processing_started_at=NULL, updated_at=? WHERE id=? AND processing_token=?').bind(nowIso(), next, nowIso(), reminder.id, token).run();
        log('reminder_rescheduled', { reminderId: reminder.id, nextSendAt: next, notificationSent: false });
        continue;
      }
      const body = lowAccounts.length === 1 ? 'One monitored account is below its balance threshold.' : `${lowAccounts.length} monitored accounts are below their balance thresholds.`;
      const result = await sendPush(env, sub, { title: 'Low DESCO balance', body, targetUrl: reminder.target_url, iconUrl: reminder.icon_url, badgeUrl: reminder.badge_url, reminderId: reminder.id });
      if (result.invalid) { await removeSubscription(env, sub.id, result.status); continue; }
      if (!result.ok) throw new Error(`Push provider status ${result.status}`);
      await env.DB.prepare('UPDATE reminders SET last_sent_at=?, next_send_at=?, attempt_count=0, processing_token=NULL, processing_started_at=NULL, updated_at=? WHERE id=? AND processing_token=?').bind(nowIso(), next, nowIso(), reminder.id, token).run();
      await env.DB.prepare('UPDATE push_subscriptions SET last_success_at=?, failure_count=0 WHERE id=?').bind(nowIso(), sub.id).run();
      log('push_sent', { reminderId: reminder.id, subscriptionId: sub.id }); log('reminder_rescheduled', { reminderId: reminder.id, nextSendAt: next });
    } catch (error) {
      const attempts = reminder.attempt_count + 1;
      const next = attempts >= 3 ? nextSendAt(reminder.scheduled_local_time, reminder.timezone) : retryAt(attempts);
      await env.DB.prepare('UPDATE reminders SET next_send_at=?, attempt_count=?, processing_token=NULL, processing_started_at=NULL, updated_at=? WHERE id=? AND processing_token=?').bind(next, attempts, nowIso(), reminder.id, token).run();
      await env.DB.prepare('UPDATE push_subscriptions SET last_failure_at=?, failure_count=failure_count+1 WHERE id=?').bind(nowIso(), sub.id).run();
      log('push_failed', { reminderId: reminder.id, subscriptionId: sub.id, attemptCount: attempts, reason: error instanceof Error ? error.message : 'unknown' });
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = cors(request, env);
    const respond = (response: Response) => {
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      return response;
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!requestAllowed(request, env)) return json({ error: 'Origin not allowed' }, 403, headers);
    const url = new URL(request.url); const path = url.pathname;
    try {
      if (request.method === 'GET' && path === '/api/push/config') return respond(json({ vapidPublicKey: env.VAPID_PUBLIC_KEY }, 200, { 'cache-control': 'no-store' }));
      if (request.method === 'POST' && path === '/api/push/subscribe') {
        if (!(await limited(env, `subscribe:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`, 30))) return respond(json({ error: 'Too many requests' }, 429));
        return respond(await subscribe(request, env));
      }
      if (request.method === 'DELETE' && path === '/api/push/unsubscribe') return respond(await unsubscribe(request, env));
      if (request.method === 'POST' && path === '/api/push/test') return respond(await testPush(request, env));
      if (request.method === 'POST' && path === '/api/reminders') return respond(await saveReminder(request, env));
      if (request.method === 'PUT' && path === '/api/account-watches') return respond(await saveAccountWatches(request, env));
      if (request.method === 'GET' && path === '/api/reminders') return respond(await listReminders(request, env));
      if (request.method === 'PUT' && /^\/api\/reminders\/[\w-]+$/.test(path)) return respond(await saveReminder(request, env, path.split('/').pop()));
      if (request.method === 'DELETE' && /^\/api\/reminders\/[\w-]+$/.test(path)) return respond(await deleteReminder(request, env, path.split('/').pop()!));
      if (request.method === 'GET' && path === '/health') return respond(json({ ok: true }));
      return json({ error: 'Not found' }, 404, headers);
    } catch (error) {
      log('request_failed', { path, message: error instanceof Error ? error.message : 'unknown' });
      return json({ error: error instanceof Error ? error.message : 'Bad request' }, 400, headers);
    }
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) { ctx.waitUntil(runCron(env)); },
};

export { nextSendAt, validTargetUrl };
