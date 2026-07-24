export interface NotificationPermissionState {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  requiresInstall?: boolean;
  backendUnavailable?: boolean;
}

export interface ReminderInput {
  id?: string;
  title: string;
  body: string;
  localTime: string;
  timezone: string;
  targetUrl?: string;
  enabled: boolean;
}
export interface AccountWatchInput { accountNo: string; label?: string; enabled: boolean; thresholdBdt?: number; }

const API_BASE = (import.meta.env.VITE_PUSH_API_BASE_URL || '').replace(/\/$/, '');
const DEVICE_ID_KEY = 'descowise_push_device_id';
const DEVICE_SECRET_KEY = 'descowise_push_device_secret';

function isIos(): boolean { return /iPad|iPhone|iPod/.test(navigator.userAgent); }
function standalone(): boolean { return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true; }
function supported(): boolean { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
function api(path: string): string { return `${API_BASE}${path}`; }

function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getDeviceIdentity(): { deviceId: string; deviceSecret: string } {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  let deviceSecret = localStorage.getItem(DEVICE_SECRET_KEY);
  if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem(DEVICE_ID_KEY, deviceId); }
  if (!deviceSecret) { deviceSecret = randomSecret(); localStorage.setItem(DEVICE_SECRET_KEY, deviceSecret); }
  return { deviceId, deviceSecret };
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const raw = atob(base64);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  if (!API_BASE) throw new Error('Notification backend is not configured');
  const { deviceSecret } = getDeviceIdentity();
  const response = await fetch(api(path), { ...init, headers: { 'content-type': 'application/json', 'x-device-secret': deviceSecret, ...init.headers } });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Notification backend failed (${response.status})`);
  }
  return response;
}

async function vapidKey(): Promise<string> {
  const configured = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (configured) return configured;
  const response = await request('/api/push/config', { method: 'GET' });
  const result = await response.json() as { vapidPublicKey?: string };
  if (!result.vapidPublicKey) throw new Error('The notification backend did not provide a VAPID public key');
  return result.vapidPublicKey;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

export async function getNotificationState(): Promise<NotificationPermissionState> {
  if (!supported()) return { supported: false, permission: 'unsupported', subscribed: false };
  if (isIos() && !standalone()) return { supported: true, permission: Notification.permission, subscribed: false, requiresInstall: true };
  try {
    const subscription = await (await registration()).pushManager.getSubscription();
    return { supported: true, permission: Notification.permission, subscribed: !!subscription };
  } catch {
    return { supported: true, permission: Notification.permission, subscribed: false, backendUnavailable: true };
  }
}

async function uploadSubscription(subscription: PushSubscription | PushSubscriptionJSON): Promise<void> {
  const { deviceId, deviceSecret } = getDeviceIdentity();
  await request('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: 'toJSON' in subscription ? subscription.toJSON() : subscription, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: navigator.language, deviceId, deviceSecret }) });
}

export async function enablePushNotifications(): Promise<void> {
  if (!supported()) throw new Error('Web Push is not supported by this browser');
  if (isIos() && !standalone()) throw new Error('Install DescoWise to the Home Screen in Safari before enabling notifications on iPhone or iPad');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'Notifications are blocked. Re-enable them in browser or operating system settings.' : 'Notification permission was not granted');
  const worker = await registration();
  const key = await vapidKey();
  const existing = await worker.pushManager.getSubscription();
  const subscription = existing ?? await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
  await uploadSubscription(subscription);
}

export async function refreshPushSubscription(): Promise<void> {
  if (!supported() || Notification.permission !== 'granted' || (isIos() && !standalone())) return;
  const subscription = await (await registration()).pushManager.getSubscription();
  if (subscription) await uploadSubscription(subscription);
}

export async function syncChangedPushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  if (subscription.endpoint && subscription.keys?.auth && subscription.keys.p256dh) await uploadSubscription(subscription);
}

export async function disablePushNotifications(): Promise<void> {
  if (!supported()) return;
  const subscription = await (await registration()).pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
  // Server removal intentionally uses the device secret; it cannot remove a different device's subscription.
  const { deviceId } = getDeviceIdentity();
  await request(`/api/push/unsubscribe?deviceId=${encodeURIComponent(deviceId)}`, { method: 'DELETE' });
}

export async function sendTestNotification(): Promise<void> {
  const { deviceId } = getDeviceIdentity();
  await request('/api/push/test', { method: 'POST', body: JSON.stringify({ deviceId }) });
}

export async function syncReminderSchedule(reminder: ReminderInput): Promise<{ id: string; nextSendAt: string }> {
  const { deviceId } = getDeviceIdentity();
  const path = reminder.id ? `/api/reminders/${encodeURIComponent(reminder.id)}` : '/api/reminders';
  const response = await request(path, { method: reminder.id ? 'PUT' : 'POST', body: JSON.stringify({ ...reminder, deviceId }) });
  return response.json() as Promise<{ id: string; nextSendAt: string }>;
}

export async function syncAccountWatches(globalThresholdBdt: number, accounts: AccountWatchInput[]): Promise<void> {
  const { deviceId } = getDeviceIdentity();
  await request('/api/account-watches', { method: 'PUT', body: JSON.stringify({ deviceId, globalThresholdBdt, accounts }) });
}

export function getPushDiagnostics() {
  return getNotificationState().then(async state => {
    const worker = supported() ? await navigator.serviceWorker.getRegistration() : undefined;
    const subscription = worker ? await worker.pushManager.getSubscription() : null;
    return { serviceWorkerSupported: 'serviceWorker' in navigator, serviceWorkerState: worker?.active?.state ?? 'none', notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported', pushSupported: 'PushManager' in window, subscriptionExists: !!subscription, endpointHost: subscription ? new URL(subscription.endpoint).host : undefined, pwaStandalone: standalone(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  });
}
