import React, { useEffect, useState } from 'react';
import { BellIcon, CloseIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/Icons';
import Spinner from './common/Spinner';
import { Account } from '../types';
import {
  disablePushNotifications, enablePushNotifications, getNotificationState, sendTestNotification,
  syncAccountWatches, syncReminderSchedule, type NotificationPermissionState,
} from '../services/pushNotificationService';

interface NotificationSettingsModalProps { isOpen: boolean; onClose: () => void; }
type Watch = { enabled: boolean; threshold?: number };
const REMINDER_ID_KEY = 'descowise_push_reminder_id';
const WATCHES_KEY = 'descowise_account_watches';
const DAILY_NOTIFICATION_TIME = '06:00';

function savedAccounts(): Account[] { try { return JSON.parse(localStorage.getItem('desco_accounts') || '[]') as Account[]; } catch { return []; } }
function savedWatches(): Record<string, Watch> { try { return JSON.parse(localStorage.getItem(WATCHES_KEY) || '{}') as Record<string, Watch>; } catch { return {}; } }

const initialState: NotificationPermissionState = { supported: true, permission: 'default', subscribed: false };

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState(initialState);
  const [globalThreshold, setGlobalThreshold] = useState(() => Number(localStorage.getItem('descowise_global_threshold') || 500));
  const [watches, setWatches] = useState<Record<string, Watch>>(savedWatches);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingAccounts, setEditingAccounts] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const accounts = savedAccounts();

  const refresh = async () => setState(await getNotificationState());
  useEffect(() => { if (isOpen) { void refresh(); document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; } }, [isOpen]);
  const enabled = state.permission === 'granted' && state.subscribed;
  const monitoredCount = accounts.filter(account => watches[account.accountNo]?.enabled).length;
  const status = !state.supported ? 'Unsupported' : state.requiresInstall ? 'Install required' : state.permission === 'denied' ? 'Permission denied' : enabled ? 'Enabled' : state.backendUnavailable ? 'Backend unavailable' : 'Not enabled';

  const watchPayload = () => accounts.map(account => ({ accountNo: account.accountNo, label: account.displayName || account.customerName, enabled: watches[account.accountNo]?.enabled ?? false, thresholdBdt: watches[account.accountNo]?.threshold }));
  const persist = async () => {
    await syncAccountWatches(globalThreshold, watchPayload());
    const reminder = await syncReminderSchedule({ id: localStorage.getItem(REMINDER_ID_KEY) || undefined, title: 'Daily DESCO check-in', body: 'Open DescoWise to review your daily account update.', localTime: DAILY_NOTIFICATION_TIME, timezone: 'Asia/Dhaka', targetUrl: '/', enabled: true });
    localStorage.setItem(REMINDER_ID_KEY, reminder.id);
    localStorage.setItem('descowise_global_threshold', String(globalThreshold)); localStorage.setItem(WATCHES_KEY, JSON.stringify(watches));
  };
  const run = async (action: () => Promise<void>, success: string) => { setBusy(true); setMessage(null); try { await action(); await refresh(); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong'); } finally { setBusy(false); } };
  const enable = () => run(async () => { await enablePushNotifications(); await persist(); }, 'Notifications enabled.');
  const saveChanges = () => run(async () => { await persist(); setHasChanges(false); }, 'Changes saved.');

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-slate-100 sm:inset-4 sm:mx-auto sm:max-w-lg sm:overflow-hidden sm:rounded-3xl sm:border sm:border-slate-700 sm:shadow-2xl">
    <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:pt-3">
      <div className="flex items-center gap-2.5"><BellIcon className="h-5 w-5 text-blue-300" /><div><h1 className="text-base font-semibold text-white">Notifications</h1><p className={`text-xs ${enabled ? 'text-emerald-400' : 'text-slate-400'}`}>{enabled ? 'Enabled' : status}</p></div></div>
      <button onClick={onClose} aria-label="Close notification settings" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><CloseIcon className="h-6 w-6" /></button>
    </header>

    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
      {state.requiresInstall && <p className="mb-5 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm leading-6 text-blue-100"><InformationCircleIcon className="mr-1 inline h-4 w-4" />Add DescoWise to your Home Screen from Safari, then open it there to enable notifications.</p>}
      {state.permission === 'denied' && <p className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm leading-6 text-rose-100"><ExclamationTriangleIcon className="mr-1 inline h-4 w-4" />Re-enable notifications in browser or device settings.</p>}

      {enabled && <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center justify-between px-4 py-3.5"><span><span className="block text-sm font-medium text-white">Daily balance check</span><span className="mt-0.5 block text-xs text-slate-500">Every day in Bangladesh time, after DESCO's midnight data refresh</span></span><span className="text-sm font-semibold text-slate-300">6:00 AM BDT</span></div>
        <button onClick={() => { setEditingAccounts(value => !value); }} className="flex w-full items-center justify-between px-4 py-3.5 text-left"><span><span className="block text-sm font-medium text-white">Monitored accounts</span><span className="mt-0.5 block text-xs text-slate-500">{monitoredCount ? `${monitoredCount} selected · Default ৳${globalThreshold}` : 'Choose accounts to monitor'}</span></span><span className="text-sm font-semibold text-blue-300">Manage ›</span></button>
        {editingAccounts && <div className="px-4 py-3"><label className="mb-3 flex items-center justify-between text-xs text-slate-400">Default threshold <span>৳ <input type="number" min="0" value={globalThreshold} onChange={event => { setGlobalThreshold(Number(event.target.value)); setHasChanges(true); }} className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-sm text-white" /></span></label><div className="space-y-2">{accounts.map(account => { const rule = watches[account.accountNo] || { enabled: false }; return <div key={account.accountNo} className="rounded-lg bg-slate-950/60 p-3"><div className="flex items-center gap-3"><input type="checkbox" checked={rule.enabled} onChange={event => { setWatches(current => ({ ...current, [account.accountNo]: { ...rule, enabled: event.target.checked } })); setHasChanges(true); }} className="h-5 w-5 accent-blue-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{account.displayName || account.customerName || account.accountNo}</p><p className="text-xs text-slate-500">{account.accountNo}</p></div></div>{rule.enabled && <label className="mt-3 flex items-center justify-between text-xs text-slate-400">Alert below <span>৳ <input type="number" min="0" placeholder={String(globalThreshold)} value={rule.threshold ?? ''} onChange={event => { const value = event.target.value; setWatches(current => ({ ...current, [account.accountNo]: { ...rule, threshold: value ? Number(value) : undefined } })); setHasChanges(true); }} className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-white" /></span></label>}</div>; })}</div></div>}
        <button onClick={() => void run(() => sendTestNotification(), 'Test notification sent.')} disabled={busy} className="flex w-full items-center justify-between px-4 py-3.5 text-left"><span><span className="block text-sm font-medium text-white">Test notification</span><span className="mt-0.5 block text-xs text-slate-500">Confirm background delivery</span></span><span className="text-sm font-semibold text-blue-300">Send ›</span></button>
        <button onClick={() => void run(() => disablePushNotifications(), 'Notifications disabled.')} disabled={busy} className="w-full px-4 py-3 text-left text-sm font-medium text-rose-300 hover:bg-rose-500/5">Disable notifications</button>
      </div>}
      {message && <p className={`mt-4 rounded-lg px-3 py-2.5 text-sm ${message.toLowerCase().includes('wrong') || message.toLowerCase().includes('failed') ? 'bg-rose-500/10 text-rose-100' : 'bg-emerald-500/10 text-emerald-100'}`}>{message}</p>}
    </main>

    <footer className={`${enabled && !hasChanges ? 'hidden' : 'shrink-0'} border-t border-slate-800 bg-slate-950 px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3`}>
      {enabled ? <button onClick={saveChanges} disabled={busy} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{busy ? <Spinner size="sm" /> : 'Save changes'}</button> : <button onClick={enable} disabled={busy || !state.supported || state.permission === 'denied' || state.requiresInstall} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{busy ? <Spinner size="sm" /> : 'Enable notifications'}</button>}
    </footer>
  </div>;
};

export default NotificationSettingsModal;
