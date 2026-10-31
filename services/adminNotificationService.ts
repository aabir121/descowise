export interface AdminNotificationAccount {
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

export interface AdminNotificationOverview {
  summary: { activeDevices: number; monitoredRules: number; uniqueAccounts: number; devicesWithFailures: number };
  accounts: AdminNotificationAccount[];
}

export interface AdminAccountCheckResult {
  accountNo: string;
  balance: number | null;
  thresholdBdt: number;
  outcome: 'sent' | 'failed' | 'expired_subscription' | 'skipped_above_threshold' | 'balance_check_failed';
  providerStatus: number | null;
}

const API_BASE = (import.meta.env.VITE_PUSH_API_BASE_URL || '').replace(/\/$/, '');

function endpoint(path: string): string {
  if (!API_BASE) throw new Error('Notification backend is not configured');
  return `${API_BASE}${path}`;
}

async function adminRequest(path: string, password: string, init: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      ...init,
      headers: { 'x-admin-password': password, 'content-type': 'application/json', ...init.headers },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the notification backend. Check VITE_PUSH_API_BASE_URL and allow this app origin in the Worker ALLOWED_ORIGIN setting.');
    }
    throw error;
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Admin request failed (${response.status})`);
  }
  return response;
}

export async function getAdminNotificationOverview(password: string): Promise<AdminNotificationOverview> {
  const response = await adminRequest('/api/admin/notification-accounts', password);
  return response.json() as Promise<AdminNotificationOverview>;
}

export async function runAdminAccountCheck(password: string, accountNo: string, subscriptionId: string, thresholdOverrideBdt?: number): Promise<AdminAccountCheckResult> {
  const response = await adminRequest('/api/admin/run-account-check', password, {
    method: 'POST',
    body: JSON.stringify({ accountNo, subscriptionId, thresholdOverrideBdt }),
  });
  return response.json() as Promise<AdminAccountCheckResult>;
}
