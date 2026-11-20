import { describe, expect, it } from 'vitest';
import worker from './index';

const key = 'watch-assertion-secret-for-tests-1234567890';
const ownerId = 'desco-owner-7';
const deviceId = 'test-device-identity-1234';
const deviceSecret = 'test-device-secret-abcdefghijklmnopqrstuvwxyz';
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

async function assertion(overrides: Record<string, unknown> = {}) {
  const payload = { aud: 'descowise-watch', ownerId, accountId: 17, accountNo: '123456789', exp: Math.floor(Date.now() / 1000) + 120, ...overrides };
  const encoded = encode(new TextEncoder().encode(JSON.stringify(payload)));
  const hmac = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${encoded}.${encode(new Uint8Array(await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(encoded))))}`;
}

function setup() {
  const batches: Array<Array<{ sql: string; values: unknown[] }>> = [];
  const queued: unknown[] = [];
  const db = {
    prepare(sql: string) {
      let values: unknown[] = [];
      const statement = {
        sql, get values() { return values; },
        bind(...args: unknown[]) { values = args; return statement; },
        async first() {
          if (sql.includes('device_secret_hash')) {
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deviceSecret));
            return { id: 'subscription-1', device_secret_hash: [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('') };
          }
          return null;
        },
        async all() {
          return { results: [{ owner_id: ownerId, account_id: 17, account_no: '123456789' }, { owner_id: ownerId, account_id: 18, account_no: '123456789' }] };
        },
      };
      return statement;
    },
    async batch(statements: Array<{ sql: string; values: unknown[] }>) { batches.push(statements); },
  };
  const env = { DB: db, WATCH_ASSERTION_KEY: key, DESCO_OWNER_ID: ownerId, ALLOWED_ORIGIN: 'https://example.com', BALANCE_CHECKS: { async sendBatch(messages: unknown[]) { queued.push(...messages); } } };
  return { env, batches, queued };
}

async function save(env: ReturnType<typeof setup>['env'], accounts: Array<Record<string, unknown>>) {
  return worker.fetch(new Request('https://worker.example/api/account-watches', {
    method: 'PUT', headers: { Origin: 'https://example.com', 'x-device-secret': deviceSecret, 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId, globalThresholdBdt: 100, accounts }),
  }), env as never);
}

describe('account watch ownership', () => {
  it('rejects a device watch without a signed owner assertion before changing rules', async () => {
    const { env, batches } = setup();
    const response = await save(env, [{ accountNo: '123456789', enabled: true }]);
    expect(response.status).toBe(403);
    expect(batches).toHaveLength(0);
  });

  it('rejects an assertion for another owner or reassigned account number', async () => {
    const { env, batches } = setup();
    const otherOwner = await assertion({ ownerId: 'another-desco-user' });
    const reassigned = await assertion({ accountNo: '987654321' });
    expect((await save(env, [{ accountNo: '123456789', enabled: true, assertion: otherOwner }])).status).toBe(403);
    expect((await save(env, [{ accountNo: '123456789', enabled: true, assertion: reassigned }])).status).toBe(403);
    expect(batches).toHaveLength(0);
  });

  it('rejects expired and tampered assertions', async () => {
    const { env, batches } = setup();
    const expired = await assertion({ exp: Math.floor(Date.now() / 1000) - 1 });
    const signed = await assertion();
    const tampered = `${signed.slice(0, -1)}${signed.at(-1) === 'A' ? 'B' : 'A'}`;
    expect((await save(env, [{ accountNo: '123456789', enabled: false, assertion: expired }])).status).toBe(403);
    expect((await save(env, [{ accountNo: '123456789', enabled: true, assertion: tampered }])).status).toBe(403);
    expect(batches).toHaveLength(0);
  });

  it('stores the verified owner and account ID on a watch', async () => {
    const { env, batches } = setup();
    const response = await save(env, [{ accountNo: '123456789', enabled: true, assertion: await assertion() }]);
    expect(response.status).toBe(200);
    expect(batches).toHaveLength(1);
    expect(batches[0][1].sql).toContain('owner_id');
    expect(batches[0][1].values).toContain(ownerId);
    expect(batches[0][1].values).toContain(17);
  });

  it('queues distinct account IDs separately even when account numbers match', async () => {
    const { env, queued } = setup();
    await worker.scheduled({} as never, env as never, { waitUntil(promise: Promise<unknown>) { void promise; } } as never);
    expect(queued).toEqual([
      { body: { ownerId, accountId: 17, accountNo: '123456789', checkDate: expect.any(String) } },
      { body: { ownerId, accountId: 18, accountNo: '123456789', checkDate: expect.any(String) } },
    ]);
  });
});
