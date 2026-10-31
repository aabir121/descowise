import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push';
import { nextSendAt, validTimezone } from './schedule';

interface Env {
  DB: D1Database;
  BALANCE_CHECKS: Queue<BalanceCheckMessage>;
  ALLOWED_ORIGIN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ADMIN_PASSWORD: string;
}
interface BalanceCheckMessage { accountNo: string; checkDate: string; }

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
const DESCO_CHECK_TIME = '06:00';
const DESCO_CHECK_TIMEZONE = 'Asia/Dhaka';

const json = (body: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
});
const nowIso = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function log(event: string, fields: Record<string, unknown> = {}) {
  // Deliberately only structured identifiers/statuses, never subscription keys or notification content.
  console.log(JSON.stringify({ event, ...fields }));
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function cors(request: Request, env: Env): HeadersInit {
  const origin = allowedOrigin(request, env);
  return origin ? {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-password,x-device-secret',
    'vary': 'Origin',
  } : {};
}

function requestAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  return !origin || allowedOrigin(request, env) !== null;
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

async function requireAdmin(request: Request, env: Env): Promise<boolean> {
  const password = request.headers.get('x-admin-password') ?? '';
  if (!password || !env.ADMIN_PASSWORD) return false;
  // Hashing both values keeps a direct string comparison out of the request path.
  return (await hash(password)) === (await hash(env.ADMIN_PASSWORD));
}

interface AdminNotificationAccount {
  accountNo: string;
  label: string | null;
  thresholdBdt: number;
  lastBalance: number | null;
  lastCheckedAt: string | null;
  lastNotifiedDate: string | null;
  deviceId: string;
  subscriptionId: string;
  timezone: string;
  locale: string | null;
  subscriptionUpdatedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureCount: number;
  lastAttemptAt: string | null;
  lastAttemptOutcome: string | null;
  lastAttemptStatus: number | null;
}

async function adminNotificationAccounts(request: Request, env: Env) {
  if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);
  const [accounts, totals] = await Promise.all([
    env.DB.prepare(`SELECT ar.account_no AS accountNo, ar.label, ar.threshold_bdt AS thresholdBdt,
      ar.last_balance AS lastBalance, ar.last_checked_at AS lastCheckedAt, ar.last_notified_date AS lastNotifiedDate,
      ps.device_id AS deviceId, ps.id AS subscriptionId, ps.timezone, ps.locale, ps.updated_at AS subscriptionUpdatedAt,
      ps.last_success_at AS lastSuccessAt, ps.last_failure_at AS lastFailureAt, ps.failure_count AS failureCount,
      (SELECT na.created_at FROM notification_attempts na WHERE na.account_no = ar.account_no AND na.device_id = ar.device_id AND na.subscription_id = ps.id ORDER BY na.created_at DESC LIMIT 1) AS lastAttemptAt,
      (SELECT na.outcome FROM notification_attempts na WHERE na.account_no = ar.account_no AND na.device_id = ar.device_id AND na.subscription_id = ps.id ORDER BY na.created_at DESC LIMIT 1) AS lastAttemptOutcome,
      (SELECT na.provider_status FROM notification_attempts na WHERE na.account_no = ar.account_no AND na.device_id = ar.device_id AND na.subscription_id = ps.id ORDER BY na.created_at DESC LIMIT 1) AS lastAttemptStatus
      FROM account_watch_rules ar
      JOIN push_subscriptions ps ON ps.device_id = ar.device_id AND ps.enabled = 1
      WHERE ar.enabled = 1
        AND EXISTS (SELECT 1 FROM reminders r WHERE r.device_id = ar.device_id AND r.enabled = 1)
      ORDER BY ar.last_checked_at DESC, ar.account_no ASC`).all<AdminNotificationAccount>(),
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM push_subscriptions WHERE enabled = 1) AS activeDevices,
      (SELECT COUNT(*) FROM account_watch_rules ar JOIN push_subscriptions ps ON ps.device_id = ar.device_id AND ps.enabled = 1
        WHERE ar.enabled = 1 AND EXISTS (SELECT 1 FROM reminders r WHERE r.device_id = ar.device_id AND r.enabled = 1)) AS monitoredRules,
      (SELECT COUNT(DISTINCT ar.account_no) FROM account_watch_rules ar JOIN push_subscriptions ps ON ps.device_id = ar.device_id AND ps.enabled = 1
        WHERE ar.enabled = 1 AND EXISTS (SELECT 1 FROM reminders r WHERE r.device_id = ar.device_id AND r.enabled = 1)) AS uniqueAccounts,
      (SELECT COUNT(*) FROM push_subscriptions WHERE enabled = 1 AND failure_count > 0) AS devicesWithFailures`).first<{
        activeDevices: number; monitoredRules: number; uniqueAccounts: number; devicesWithFailures: number;
      }>(),
  ]);
  log('admin_notification_accounts_listed', { count: accounts.results.length });
  return json({
    summary: totals ?? { activeDevices: 0, monitoredRules: 0, uniqueAccounts: 0, devicesWithFailures: 0 },
    accounts: accounts.results,
  }, 200, { 'cache-control': 'no-store' });
}

async function adminRunAccountCheck(request: Request, env: Env) {
  if (!(await requireAdmin(request, env))) return json({ error: 'Unauthorized' }, 401);
  const input = await body<{ accountNo?: string; subscriptionId?: string; thresholdOverrideBdt?: number }>(request);
  if (!input.accountNo || !/^\d{5,30}$/.test(input.accountNo) || !input.subscriptionId || !/^[\w-]{1,128}$/.test(input.subscriptionId)) return json({ error: 'Select a monitored account and subscribed device' }, 400);
  if (input.thresholdOverrideBdt !== undefined && (!Number.isFinite(input.thresholdOverrideBdt) || input.thresholdOverrideBdt < 0 || input.thresholdOverrideBdt > 1_000_000)) return json({ error: 'Invalid threshold override' }, 400);
  if (!(await limited(env, `admin-check:${input.subscriptionId}`, 10))) return json({ error: 'Too many forced checks for this device' }, 429);
  const results = await processBalanceCheck({ accountNo: input.accountNo, checkDate: bangladeshDate() }, env, {
    subscriptionId: input.subscriptionId,
    thresholdOverrideBdt: input.thresholdOverrideBdt,
    force: true,
  });
  if (!results.length) return json({ error: 'Account is no longer monitored by this device' }, 404);
  log('admin_account_check_finished', { accountNo: input.accountNo, subscriptionId: input.subscriptionId, outcome: results[0].outcome });
  return json(results[0]);
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
    || typeof input.enabled !== 'boolean'
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
  // DESCO publishes its daily data at midnight Bangladesh time. This is deliberately
  // not user-configurable: every device checks at 06:00 Asia/Dhaka after that refresh.
  const next = input.enabled ? nextSendAt(DESCO_CHECK_TIME, DESCO_CHECK_TIMEZONE) : '9999-12-31T00:00:00.000Z';
  if (reminderId) {
    const changed = await env.DB.prepare(`UPDATE reminders SET title=?, body=?, target_url=?, icon_url=?, badge_url=?, scheduled_local_time=?, timezone=?, enabled=?, next_send_at=?, attempt_count=0, processing_token=NULL, processing_started_at=NULL, updated_at=? WHERE id=? AND device_id=?`).bind(
      input.title.trim(), input.body.trim(), input.targetUrl ?? '/', input.iconUrl ?? null, input.badgeUrl ?? null, DESCO_CHECK_TIME, DESCO_CHECK_TIMEZONE, Number(input.enabled), next, timestamp, reminder, input.deviceId).run();
    if (!changed.meta.changes) return json({ error: 'Reminder not found' }, 404);
    log('reminder_updated', { reminderId: reminder, deviceId: input.deviceId });
  } else {
    await env.DB.prepare(`INSERT INTO reminders (id, device_id, subscription_id, title, body, target_url, icon_url, badge_url, scheduled_local_time, timezone, enabled, next_send_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(reminder, input.deviceId, subscription.id, input.title.trim(), input.body.trim(), input.targetUrl ?? '/', input.iconUrl ?? null, input.badgeUrl ?? null, DESCO_CHECK_TIME, DESCO_CHECK_TIMEZONE, Number(input.enabled), next, timestamp, timestamp).run();
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

function bangladeshDate(): string { return new Intl.DateTimeFormat('en-CA', { timeZone: DESCO_CHECK_TIMEZONE }).format(new Date()); }

type BalanceWatchRule = {
  account_no: string; label: string | null; device_id: string; threshold_bdt: number; last_notified_date: string | null;
  id: string; endpoint: string; p256dh: string; auth: string;
};
type BalanceCheckOptions = { subscriptionId?: string; thresholdOverrideBdt?: number; force?: boolean };
type BalanceCheckResult = { accountNo: string; balance: number | null; thresholdBdt: number; outcome: 'sent' | 'failed' | 'expired_subscription' | 'skipped_above_threshold' | 'balance_check_failed'; providerStatus: number | null };

async function recordNotificationAttempt(env: Env, rule: BalanceWatchRule, checkDate: string, outcome: string, balance: number | null, providerStatus: number | null = null) {
  await env.DB.prepare(`INSERT INTO notification_attempts
    (id, account_no, device_id, subscription_id, check_date, balance, threshold_bdt, outcome, provider_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id(), rule.account_no, rule.device_id, rule.id, checkDate, balance, rule.threshold_bdt, outcome, providerStatus, nowIso()).run();
}

function bdt(value: number): string {
  return `৳${new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(value)}`;
}

function lowBalanceNotification(rule: BalanceWatchRule, balance: number) {
  const account = rule.label?.trim() || `Account ${rule.account_no}`;
  const deficit = rule.threshold_bdt - balance;
  return {
    title: `Low balance: ${account}`,
    body: `${account} has ${bdt(balance)} remaining — ${bdt(deficit)} below its ${bdt(rule.threshold_bdt)} threshold.`,
  };
}

async function enqueueDailyChecks(env: Env) {
  const checkDate = bangladeshDate();
  log('cron_started', { checkDate });
  const accounts = await env.DB.prepare('SELECT DISTINCT account_no FROM account_watch_rules WHERE enabled = 1').all<{ account_no: string }>();
  // Cloudflare Queue sendBatch accepts at most 100 messages. Chunking keeps the
  // once-daily fan-out safe even as the registered account set grows.
  for (let index = 0; index < accounts.results.length; index += 100) {
    await env.BALANCE_CHECKS.sendBatch(
      accounts.results.slice(index, index + 100).map(({ account_no }) => ({ body: { accountNo: account_no, checkDate } })),
    );
  }
  log('balance_checks_queued', { uniqueAccountCount: accounts.results.length });
}

async function processBalanceCheck(message: BalanceCheckMessage, env: Env, options: BalanceCheckOptions = {}): Promise<BalanceCheckResult[]> {
  const query = `SELECT ar.account_no, ar.label, ar.device_id, ar.threshold_bdt, ar.last_notified_date, ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM account_watch_rules ar JOIN push_subscriptions ps ON ps.device_id=ar.device_id AND ps.enabled=1
    WHERE ar.account_no=? AND ar.enabled=1 AND EXISTS (SELECT 1 FROM reminders r WHERE r.device_id=ar.device_id AND r.enabled=1)${options.subscriptionId ? ' AND ps.id=?' : ''}`;
  const rules = options.subscriptionId
    ? await env.DB.prepare(query).bind(message.accountNo, options.subscriptionId).all<BalanceWatchRule>()
    : await env.DB.prepare(query).bind(message.accountNo).all<BalanceWatchRule>();
  let balance: number;
  try {
    const response = await fetch(`https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=${encodeURIComponent(message.accountNo)}`, { headers: { accept: 'application/json' } });
    const result = await response.json() as { code?: number; data?: { balance?: unknown } };
    balance = Number(result.data?.balance);
    if (!response.ok || result.code !== 200 || !Number.isFinite(balance)) throw new Error('DESCO balance response unavailable');
  } catch {
    await Promise.all(rules.results.map((rule) => recordNotificationAttempt(env, rule, message.checkDate, 'balance_check_failed', null)));
    throw new Error('DESCO balance response unavailable');
  }
  await env.DB.prepare('UPDATE account_watch_rules SET last_balance=?, last_checked_at=?, updated_at=? WHERE account_no=?').bind(balance, nowIso(), nowIso(), message.accountNo).run();
  const outcomes: BalanceCheckResult[] = [];
  for (const rule of rules.results) {
    const effectiveRule = options.thresholdOverrideBdt === undefined ? rule : { ...rule, threshold_bdt: options.thresholdOverrideBdt };
    if (balance >= effectiveRule.threshold_bdt) {
      await recordNotificationAttempt(env, effectiveRule, message.checkDate, 'skipped_above_threshold', balance);
      outcomes.push({ accountNo: message.accountNo, balance, thresholdBdt: effectiveRule.threshold_bdt, outcome: 'skipped_above_threshold', providerStatus: null });
      continue;
    }
    if (!options.force && rule.last_notified_date === message.checkDate) {
      await recordNotificationAttempt(env, effectiveRule, message.checkDate, 'skipped_already_sent', balance);
      continue;
    }
    const notification = lowBalanceNotification(effectiveRule, balance);
    const push = await sendPush(env, effectiveRule, { ...notification, targetUrl: '/', reminderId: message.accountNo });
    if (push.invalid) {
      await recordNotificationAttempt(env, effectiveRule, message.checkDate, 'expired_subscription', balance, push.status);
      await removeSubscription(env, rule.id, push.status);
      outcomes.push({ accountNo: message.accountNo, balance, thresholdBdt: effectiveRule.threshold_bdt, outcome: 'expired_subscription', providerStatus: push.status });
      continue;
    }
    if (push.ok) {
      if (!options.force) await env.DB.prepare('UPDATE account_watch_rules SET last_notified_date=? WHERE device_id=? AND account_no=?').bind(message.checkDate, rule.device_id, message.accountNo).run();
      await env.DB.prepare('UPDATE push_subscriptions SET last_success_at=?, failure_count=0 WHERE id=?').bind(nowIso(), rule.id).run();
      await recordNotificationAttempt(env, effectiveRule, message.checkDate, 'sent', balance, push.status);
      outcomes.push({ accountNo: message.accountNo, balance, thresholdBdt: effectiveRule.threshold_bdt, outcome: 'sent', providerStatus: push.status });
      log('push_sent', { subscriptionId: rule.id, accountChecked: true });
    } else {
      await env.DB.prepare('UPDATE push_subscriptions SET last_failure_at=?, failure_count=failure_count+1 WHERE id=?').bind(nowIso(), rule.id).run();
      await recordNotificationAttempt(env, effectiveRule, message.checkDate, 'failed', balance, push.status);
      outcomes.push({ accountNo: message.accountNo, balance, thresholdBdt: effectiveRule.threshold_bdt, outcome: 'failed', providerStatus: push.status });
      log('push_failed', { subscriptionId: rule.id, status: push.status });
    }
  }
  log('balance_checked', { accountChecked: true, matchingRules: rules.results.length });
  return outcomes;
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
      if (request.method === 'GET' && path === '/api/admin/notification-accounts') return respond(await adminNotificationAccounts(request, env));
      if (request.method === 'POST' && path === '/api/admin/run-account-check') return respond(await adminRunAccountCheck(request, env));
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
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) { ctx.waitUntil(enqueueDailyChecks(env)); },
  async queue(batch: MessageBatch<BalanceCheckMessage>, env: Env) {
    for (const message of batch.messages) {
      try { await processBalanceCheck(message.body, env); message.ack(); }
      catch (error) { log('balance_check_failed', { reason: error instanceof Error ? error.message : 'unknown' }); message.retry(); }
    }
  },
};

export { nextSendAt, validTargetUrl };
