const BASE_URL = 'https://prepaid.desco.org.bd/api';

export interface DescoLinkedAccount {
  accountId: number;
  accountNo: string;
  meterNo: string;
  sourceSystem?: string;
  status?: string;
  linkStatus?: string;
}

export interface DescoBalance {
  accountNo: string;
  balance: number;
  stale: false;
  timestampAvailable: true;
  balanceSnapshotAt: string;
  meterNo?: string;
  meterType?: string;
  currency?: string;
  currentMonthConsumedTaka?: number | null;
  readingTime?: string | null;
}

export class DescoClientError extends Error {
  constructor(
    message: string,
    public readonly code: 'authentication_required' | 'request_failed' | 'invalid_response' | 'stale' | 'unavailable',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'DescoClientError';
  }
}

export interface DescoClientOptions {
  username: string;
  password: string;
  fetch?: typeof globalThis.fetch;
}

function dhakaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function receiveCookies(headers: Headers, jar: Map<string, string>): void {
  const values = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie') ?? ''];
  for (const value of values) {
    for (const match of value.matchAll(/(?:^|,\s*)(XSRF-TOKEN|DESCO_SESSION)=([^; ,]*)/g)) {
      if (match[2]) jar.set(match[1], match[2]);
      else jar.delete(match[1]);
    }
  }
}

export class DescoClient {
  private readonly fetcher: typeof globalThis.fetch;
  private cookies = new Map<string, string>();
  private authenticated = false;
  private loginPromise: Promise<void> | null = null;

  constructor(private readonly options: DescoClientOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  private async request(path: string, method = 'GET', body?: unknown): Promise<Response> {
    const headers = new Headers({ Accept: 'application/json' });
    if (this.cookies.size) {
      headers.set('Cookie', [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; '));
    }
    if (method !== 'GET') {
      headers.set('Content-Type', 'application/json');
      const csrf = this.cookies.get('XSRF-TOKEN');
      if (csrf) {
        try { headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf)); }
        catch { throw new DescoClientError('DESCO CSRF token is invalid', 'invalid_response'); }
      }
    }
    let result: Response;
    try {
      result = await this.fetcher(new Request(`${BASE_URL}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual', signal: AbortSignal.timeout(20_000),
      }));
    } catch {
      throw new DescoClientError('DESCO network request failed', 'request_failed');
    }
    receiveCookies(result.headers, this.cookies);
    return result;
  }

  private async login(): Promise<void> {
    if (this.authenticated) return;
    if (!this.loginPromise) {
      this.loginPromise = this.performLogin();
    }
    try { await this.loginPromise; }
    finally { this.loginPromise = null; }
  }

  private async performLogin(): Promise<void> {
    this.cookies = new Map();
    const csrf = await this.request('/auth/csrf');
    if (!csrf.ok || !this.cookies.has('XSRF-TOKEN')) {
      throw new DescoClientError('DESCO CSRF request failed', 'request_failed', csrf.status);
    }
    const result = await this.request('/auth/login', 'POST', {
      username: this.options.username, password: this.options.password,
    });
    if (!result.ok) {
      throw new DescoClientError('DESCO login failed', result.status === 401 ? 'authentication_required' : 'request_failed', result.status);
    }
    if (!this.cookies.has('DESCO_SESSION')) {
      throw new DescoClientError('DESCO login did not establish a session', 'invalid_response', result.status);
    }
    this.authenticated = true;
  }

  private async protectedGet(path: string): Promise<unknown> {
    await this.login();
    let result = await this.request(path);
    if (result.status === 401) {
      this.authenticated = false;
      await this.login();
      result = await this.request(path);
    }
    if (!result.ok) {
      throw new DescoClientError(
        result.status === 401 ? 'DESCO session expired' : 'DESCO request failed',
        result.status === 401 ? 'authentication_required' : 'request_failed', result.status,
      );
    }
    try { return await result.json(); }
    catch { throw new DescoClientError('DESCO returned invalid JSON', 'invalid_response', result.status); }
  }

  async listAccounts(): Promise<DescoLinkedAccount[]> {
    const data = await this.protectedGet('/accounts');
    if (!data || typeof data !== 'object' || !('accounts' in data) || !Array.isArray(data.accounts)
      || !data.accounts.every((account: unknown) => account && typeof account === 'object'
        && 'accountId' in account && Number.isSafeInteger(account.accountId) && Number(account.accountId) > 0
        && 'accountNo' in account && typeof account.accountNo === 'string'
        && 'meterNo' in account && typeof account.meterNo === 'string')) {
      throw new DescoClientError('DESCO returned an invalid account list', 'invalid_response');
    }
    return data.accounts as DescoLinkedAccount[];
  }

  async getUserId(): Promise<string> {
    const data = await this.protectedGet('/auth/session');
    if (!data || typeof data !== 'object' || !('authenticated' in data) || data.authenticated !== true
      || !('userId' in data) || !/^[\w-]{1,128}$/.test(String(data.userId ?? ''))) {
      throw new DescoClientError('DESCO identity is unavailable', 'authentication_required');
    }
    return String(data.userId);
  }

  async getBalance(accountId: number, checkDate = dhakaDate(new Date())): Promise<DescoBalance> {
    const checkDateUtc = new Date(`${checkDate}T00:00:00Z`);
    if (!Number.isSafeInteger(accountId) || accountId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(checkDate)
      || !Number.isFinite(checkDateUtc.getTime()) || checkDateUtc.toISOString().slice(0, 10) !== checkDate) {
      throw new DescoClientError('Invalid DESCO balance request', 'invalid_response');
    }
    const data = await this.protectedGet(`/accounts/${accountId}/balance`);
    if (!data || typeof data !== 'object' || !('balance' in data)
      || typeof data.balance !== 'number' || !Number.isFinite(data.balance)) {
      throw new DescoClientError('DESCO balance is unavailable', 'unavailable');
    }
    const previousDate = new Date(checkDateUtc.getTime() - 86_400_000).toISOString().slice(0, 10);
    const snapshotDate = 'balanceSnapshotAt' in data && typeof data.balanceSnapshotAt === 'string'
      && /(?:Z|[+-]\d{2}:\d{2})$/i.test(data.balanceSnapshotAt)
      && Number.isFinite(Date.parse(data.balanceSnapshotAt))
      ? dhakaDate(new Date(data.balanceSnapshotAt)) : null;
    if (!('stale' in data) || data.stale !== false
      || !('timestampAvailable' in data) || data.timestampAvailable !== true
      || (snapshotDate !== checkDate && snapshotDate !== previousDate)) {
      throw new DescoClientError('DESCO balance snapshot is stale or unavailable', 'stale');
    }
    return data as DescoBalance;
  }
}

export function createDescoClient(options: DescoClientOptions): DescoClient {
  return new DescoClient(options);
}
