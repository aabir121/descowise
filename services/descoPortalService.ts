export interface LinkedAccount { accountId: string; accountNo: string; meterNo: string; sourceSystem?: string; [key: string]: unknown }
export class PortalRequestError extends Error {
 constructor(message: string, public readonly status: number) { super(message); }
}
export async function portalRequest(path: string, options: RequestInit = {}) {
 const response = await fetch(`/api/desco${path}`, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } });
 const contentType = response.headers?.get('Content-Type');
 if (response.status !== 204 && contentType && !/\bjson\b|\+json\b/i.test(contentType)) {
    debugger;
  throw new Error('DESCO backend is unavailable: the API returned a web page instead of JSON. Start the Pages-backed dev server or deploy the Pages Functions.');
 }
 let data: any = null;
 if (response.status !== 204) {
  try { data = await response.json(); }
  catch { throw new Error('DESCO backend is unavailable: the API did not return valid JSON.'); }
 }
 if (!response.ok) {
  if (response.status === 401 && path !== '/login' && typeof window !== 'undefined') window.dispatchEvent(new Event('desco-session-expired'));
  throw new PortalRequestError(data?.message || data?.error?.message || (typeof data?.error === 'string' ? data.error : 'DESCO request failed. Please try again.'), response.status);
 }
 return data;
}
export async function listLinkedAccounts(): Promise<LinkedAccount[]> {
 const result = await portalRequest('/accounts'); return Array.isArray(result) ? result : result.accounts || result.data || [];
}
export async function accountResource(accountNo: string, resource: string, query = '') {
 const account = (await listLinkedAccounts()).find(a => a.accountNo === accountNo);
 if (!account) throw new Error('This account is not linked to your DESCO session.');
 return portalRequest(`/accounts/${encodeURIComponent(account.accountId)}/${resource}${query}`);
}
