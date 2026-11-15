import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

// Encryption and VAPID signing belong to the web-push package. This test exercises
// the worker's decision to call the provider, not the package's cryptography.
vi.mock('@block65/webcrypto-web-push', () => ({
  buildPushPayload: async () => ({ method: 'POST', headers: {}, body: new Uint8Array() }),
}));

const ownerId = 'owner-17';
const accountNo = '123456789';
const accountId = 17;
const deviceId = 'integration-device-12345';
const deviceSecret = 'integration-device-secret-abcdefghijklmnopqrstuvwxyz';
const assertionKey = 'integration-assertion-key-abcdefghijklmnopqrstuvwxyz';
const endpoint = 'https://push.example/send';
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

async function signedAssertion() {
  const payload = { aud: 'descowise-watch', ownerId, accountId, accountNo, exp: Math.floor(Date.now() / 1000) + 120 };
  const encoded = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(assertionKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded));
  return `${encoded}.${base64url(new Uint8Array(signature))}`;
}

function fakeDatabase() {
  type Watch = { id: string; device_id: string; owner_id: string; account_id: number; account_no: string; label: string | null; enabled: number; threshold_bdt: number; last_notified_date: string | null };
  const watches: Watch[] = [];
  const attempts: Array<{ outcome: string; balance: number | null }> = [];
  const secretHash = crypto.subtle.digest('SHA-256', new TextEncoder().encode(deviceSecret))
    .then(bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join(''));
  const prepare = (sql: string) => {
    let values: unknown[] = [];
    const statement = {
      bind(...args: unknown[]) { values = args; return statement; },
      async first() {
        if (sql.includes('device_secret_hash')) return { id: 'subscription-1', device_secret_hash: await secretHash };
        throw new Error(`Unexpected first query: ${sql}`);
      },
      async all() {
        if (sql.startsWith('SELECT DISTINCT owner_id')) return { results: watches.filter(w => w.enabled && w.owner_id === values[0]).map(w => ({ owner_id: w.owner_id, account_id: w.account_id, account_no: w.account_no })) };
        if (sql.includes('FROM account_watch_rules ar JOIN push_subscriptions ps')) return { results: watches.filter(w => w.enabled && w.owner_id === values[0] && w.account_id === values[1] && w.account_no === values[2]).map(w => ({ ownerId: w.owner_id, accountId: w.account_id, account_no: w.account_no, label: w.label, device_id: w.device_id, threshold_bdt: w.threshold_bdt, last_notified_date: w.last_notified_date, id: 'subscription-1', endpoint, p256dh: 'unused', auth: 'unused' })) };
        throw new Error(`Unexpected all query: ${sql}`);
      },
      async run() {
        if (sql.startsWith('DELETE FROM account_watch_rules')) {
          watches.splice(0, watches.length, ...watches.filter(w => w.device_id !== values[0]));
        } else if (sql.startsWith('INSERT INTO account_watch_rules')) {
          watches.push({ id: values[0] as string, device_id: values[1] as string, owner_id: values[2] as string, account_id: values[3] as number, account_no: values[4] as string, label: values[5] as string | null, enabled: values[6] as number, threshold_bdt: values[7] as number, last_notified_date: null });
        } else if (sql.startsWith('INSERT INTO notification_attempts')) {
          attempts.push({ outcome: values[7] as string, balance: values[5] as number | null });
        } else if (sql.startsWith('UPDATE account_watch_rules SET last_notified_date')) {
          for (const watch of watches) if (watch.device_id === values[1] && watch.owner_id === values[2] && watch.account_id === values[3] && watch.account_no === values[4]) watch.last_notified_date = values[0] as string;
        } else if (!sql.startsWith('UPDATE account_watch_rules SET last_balance') && !sql.startsWith('UPDATE push_subscriptions SET last_success_at')) {
          throw new Error(`Unexpected run query: ${sql}`);
        }
        return { meta: { changes: 1 } };
      },
    };
    return statement;
  };
  return { prepare, async batch(statements: Array<{ run: () => Promise<unknown> }>) { for (const statement of statements) await statement.run(); }, watches, attempts };
}

afterEach(() => vi.unstubAllGlobals());

describe('signed watch to queued DESCO push', () => {
  it('never pushes stale data, then sends a fresh low balance only once across retry', async () => {
    const DB = fakeDatabase();
    const queued: Array<{ body: { ownerId: string; accountId: number; accountNo: string; checkDate: string } }> = [];
    const env = {
      DB, BALANCE_CHECKS: { async sendBatch(messages: typeof queued) { queued.push(...messages); } },
      WATCH_ASSERTION_KEY: assertionKey, DESCO_OWNER_ID: ownerId,
      DESCO_USER: 'integration-owner', DESCO_PASS: 'integration-password',
      ALLOWED_ORIGIN: 'https://app.example', VAPID_PUBLIC_KEY: 'unused', VAPID_PRIVATE_KEY: 'unused', VAPID_SUBJECT: 'mailto:test@example.com',
    };
    let stale = true;
    const providerRequests: Request[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input);
      const path = new URL(request.url).pathname;
      if (request.url === endpoint) { providerRequests.push(request); return new Response(null, { status: 201 }); }
      if (path === '/api/auth/csrf') return new Response(null, { status: 204, headers: { 'Set-Cookie': 'XSRF-TOKEN=csrf-token; Path=/' } });
      if (path === '/api/auth/login') return new Response('{}', { status: 200, headers: { 'Set-Cookie': 'DESCO_SESSION=session-token; Path=/' } });
      if (path === '/api/auth/session') return Response.json({ authenticated: true, userId: ownerId });
      if (path === '/api/accounts') return Response.json({ accounts: [{ accountId, accountNo, meterNo: 'meter-9' }] });
      if (path === `/api/accounts/${accountId}/balance`) return Response.json({ accountNo, balance: 25, stale, timestampAvailable: true, balanceSnapshotAt: `${queued[0].body.checkDate}T06:00:00+06:00` });
      throw new Error(`Unexpected request: ${request.url}`);
    });

    const registered = await worker.fetch(new Request('https://worker.example/api/account-watches', {
      method: 'PUT', headers: { Origin: 'https://app.example', 'x-device-secret': deviceSecret, 'content-type': 'application/json' },
      body: JSON.stringify({ deviceId, globalThresholdBdt: 100, accounts: [{ accountNo, enabled: true, assertion: await signedAssertion() }] }),
    }), env as never);
    expect(registered.status).toBe(200);
    expect(DB.watches).toHaveLength(1);

    let scheduled: Promise<unknown> = Promise.resolve();
    worker.scheduled({} as never, env as never, { waitUntil(promise: Promise<unknown>) { scheduled = promise; } } as never);
    await scheduled;
    expect(queued).toHaveLength(1);
    const message = queued[0].body;
    const runQueue = async () => {
      let acked = 0; let retried = 0;
      await worker.queue({ messages: [{ body: message, ack() { acked++; }, retry() { retried++; } }] } as never, env as never);
      return { acked, retried };
    };

    expect(await runQueue()).toEqual({ acked: 0, retried: 1 });
    expect(providerRequests).toHaveLength(0);
    expect(DB.attempts.map(attempt => attempt.outcome)).toEqual(['balance_check_failed']);

    stale = false;
    expect(await runQueue()).toEqual({ acked: 1, retried: 0 });
    expect(await runQueue()).toEqual({ acked: 1, retried: 0 });
    expect(providerRequests).toHaveLength(1);
    expect(DB.attempts.map(attempt => attempt.outcome)).toEqual(['balance_check_failed', 'sent', 'skipped_already_sent']);
    expect(DB.watches[0].last_notified_date).toBe(message.checkDate);
  });
});
