import { describe, expect, it, vi } from 'vitest';
import { createDescoClient, DescoClientError } from './descoClient';

const balance = {
  accountNo: '123456',
  balance: 42.5,
  stale: false,
  timestampAvailable: true,
  balanceSnapshotAt: '2026-11-15T00:30:00+06:00',
};

function response(data: unknown, status = 200, cookie?: string) {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: cookie ? { 'Set-Cookie': cookie } : undefined,
  });
}

describe('Worker DESCO client', () => {
  it('establishes CSRF/session cookies and reuses the login for linked accounts and balances', async () => {
    const fetcher = vi.fn(async (input: Request) => {
      const path = new URL(input.url).pathname;
      if (path.endsWith('/auth/csrf')) return response(null, 204, 'XSRF-TOKEN=csrf%3Dtoken; Path=/');
      if (path.endsWith('/auth/login')) {
        expect(input.headers.get('Cookie')).toBe('XSRF-TOKEN=csrf%3Dtoken');
        expect(input.headers.get('X-XSRF-TOKEN')).toBe('csrf=token');
        expect(await input.json()).toEqual({ username: 'owner', password: 'private' });
        return response({ authenticated: true }, 200, 'DESCO_SESSION=session-one; Path=/');
      }
      expect(input.headers.get('Cookie')).toContain('XSRF-TOKEN=csrf%3Dtoken');
      expect(input.headers.get('Cookie')).toContain('DESCO_SESSION=session-one');
      expect(input.headers.get('Accept')).toBe('application/json');
      if (path.endsWith('/accounts')) return response({ accounts: [{ accountId: 17, accountNo: '123456', meterNo: '987' }] });
      if (path.endsWith('/auth/session')) return response({ authenticated: true, userId: 7 });
      if (path.endsWith('/accounts/17/balance')) return response(balance);
      throw new Error(`Unexpected path ${path}`);
    });
    const client = createDescoClient({ username: 'owner', password: 'private', fetch: fetcher });

    expect(await client.listAccounts()).toEqual([{ accountId: 17, accountNo: '123456', meterNo: '987' }]);
    expect(await client.getUserId()).toBe('7');
    expect(await client.getBalance(17, '2026-11-15')).toEqual(balance);
    expect(await client.getBalance(17, '2026-11-15')).toEqual(balance);
    expect(fetcher.mock.calls.map(([request]) => new URL(request.url).pathname)).toEqual([
      '/api/auth/csrf', '/api/auth/login', '/api/accounts', '/api/auth/session', '/api/accounts/17/balance', '/api/accounts/17/balance',
    ]);
  });

  it('does one fresh CSRF/login cycle after a protected 401 and retries once', async () => {
    let login = 0;
    const fetcher = vi.fn(async (input: Request) => {
      const path = new URL(input.url).pathname;
      if (path.endsWith('/auth/csrf')) return response(null, 204, `XSRF-TOKEN=csrf${login + 1}; Path=/`);
      if (path.endsWith('/auth/login')) return response({}, 200, `DESCO_SESSION=session${++login}; Path=/`);
      if (path.endsWith('/balance')) return login === 1 ? response({ error: 'AUTHENTICATION_REQUIRED' }, 401) : response(balance);
      throw new Error(`Unexpected path ${path}`);
    });
    const client = createDescoClient({ username: 'owner', password: 'private', fetch: fetcher });

    expect(await client.getBalance(17, '2026-11-15')).toEqual(balance);
    expect(login).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it('stops after the second 401 without exposing credentials or cookies in errors', async () => {
    const fetcher = vi.fn(async (input: Request) => {
      const path = new URL(input.url).pathname;
      if (path.endsWith('/auth/csrf')) return response(null, 204, 'XSRF-TOKEN=secret-csrf; Path=/');
      if (path.endsWith('/auth/login')) return response({}, 200, 'DESCO_SESSION=secret-session; Path=/');
      return response({ message: 'secret-session private' }, 401);
    });
    const client = createDescoClient({ username: 'owner', password: 'private', fetch: fetcher });

    await expect(client.listAccounts()).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(6);
    try { await client.listAccounts(); } catch (error) {
      expect(error).toBeInstanceOf(DescoClientError);
      expect(String(error)).not.toMatch(/secret-session|secret-csrf|private/);
    }
  });

  it('does not expose sensitive text from a network failure', async () => {
    const fetcher = vi.fn(async () => { throw new Error('private secret-session'); });
    const client = createDescoClient({ username: 'owner', password: 'private', fetch: fetcher });
    await expect(client.listAccounts()).rejects.toMatchObject({ code: 'request_failed' });
    try { await client.listAccounts(); } catch (error) {
      expect(String(error)).not.toMatch(/private|secret-session/);
    }
  });

  it('accepts the previous Dhaka day for a daily snapshot', async () => {
    const previousDayBalance = { ...balance, balanceSnapshotAt: '2026-11-14T23:00:00+06:00' };
    const fetcher = vi.fn(async (input: Request) => {
      const path = new URL(input.url).pathname;
      if (path.endsWith('/auth/csrf')) return response(null, 204, 'XSRF-TOKEN=csrf; Path=/');
      if (path.endsWith('/auth/login')) return response({}, 200, 'DESCO_SESSION=session; Path=/');
      return response(previousDayBalance);
    });
    const client = createDescoClient({ username: 'owner', password: 'private', fetch: fetcher });
    expect(await client.getBalance(17, '2026-11-15')).toEqual(previousDayBalance);
  });

  it.each([
    [{ ...balance, balance: null }, 'unavailable'],
    [{ ...balance, balance: Number.NaN }, 'unavailable'],
    [{ ...balance, stale: true }, 'stale'],
    [{ ...balance, timestampAvailable: false }, 'stale'],
    [{ ...balance, balanceSnapshotAt: null }, 'stale'],
    [{ ...balance, balanceSnapshotAt: '2026-11-13T23:00:00+06:00' }, 'stale'],
    [{ ...balance, balanceSnapshotAt: '2026-11-16T00:00:00+06:00' }, 'stale'],
  ])('rejects an unsafe balance snapshot (%s)', async (payload, reason) => {
    const fetcher = vi.fn(async (input: Request) => {
      const path = new URL(input.url).pathname;
      if (path.endsWith('/auth/csrf')) return response(null, 204, 'XSRF-TOKEN=csrf; Path=/');
      if (path.endsWith('/auth/login')) return response({}, 200, 'DESCO_SESSION=session; Path=/');
      return response(payload);
    });
    const client = createDescoClient({ username: 'owner', password: 'private', fetch: fetcher });
    await expect(client.getBalance(17, '2026-11-15')).rejects.toMatchObject({ code: reason });
  });
});
