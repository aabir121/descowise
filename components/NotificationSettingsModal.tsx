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

function savedAccounts(): Account[] { try { return JSON.parse(localStorage.getItem('desco_accounts') || '[]') as Account[]; } catch { return []; } }
function savedWatches(): Record<string, Watch> { try { return JSON.parse(localStorage.getItem(WATCHES_KEY) || '{}') as Record<string, Watch>; } catch { return {}; } }

const initialState: NotificationPermissionState = { supported: true, permission: 'default', subscribed: false };

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState(initialState);
  const [time, setTime] = useState(localStorage.getItem('descowise_push_time') || '15:00');
  const [globalThreshold, setGlobalThreshold] = useState(() => Number(localStorage.getItem('descowise_global_threshold') || 500));
  const [watches, setWatches] = useState<Record<string, Watch>>(savedWatches);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [editingAccounts, setEditingAccounts] = useState(false);
  const accounts = savedAccounts();

  const refresh = async () => setState(await getNotificationState());
  useEffect(() => { if (isOpen) { void refresh(); document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; } }, [isOpen]);
  const enabled = state.permission === 'granted' && state.subscribed;
  const monitoredCount = accounts.filter(account => watches[account.accountNo]?.enabled).length;
  const status = !state.supported ? 'Unsupported' : state.requiresInstall ? 'Install required' : state.permission === 'denied' ? 'Permission denied' : enabled ? 'Enabled' : state.backendUnavailable ? 'Backend unavailable' : 'Not enabled';

  const watchPayload = () => accounts.map(account => ({ accountNo: account.accountNo, label: account.displayName || account.customerName, enabled: watches[account.accountNo]?.enabled ?? false, thresholdBdt: watches[account.accountNo]?.threshold }));
  const persist = async () => {
    await syncAccountWatches(globalThreshold, watchPayload());
    const reminder = await syncReminderSchedule({ id: localStorage.getItem(REMINDER_ID_KEY) || undefined, title: 'Daily DESCO check-in', body: 'Open DescoWise to review your daily account update.', localTime: time, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, targetUrl: '/', enabled: true });
    localStorage.setItem(REMINDER_ID_KEY, reminder.id); localStorage.setItem('descowise_push_time', time);
    localStorage.setItem('descowise_global_threshold', String(globalThreshold)); localStorage.setItem(WATCHES_KEY, JSON.stringify(watches));
  };
  const run = async (action: () => Promise<void>, success: string) => { setBusy(true); setMessage(null); try { await action(); await refresh(); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong'); } finally { setBusy(false); } };
  const enable = () => run(async () => { await enablePushNotifications(); await persist(); }, 'Notifications enabled.');

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-slate-100 sm:inset-4 sm:mx-auto sm:max-w-lg sm:overflow-hidden sm:rounded-3xl sm:border sm:border-slate-700 sm:shadow-2xl">
    <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-4">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15"><BellIcon className="h-5 w-5 text-blue-300" /></span><h1 className="text-lg font-semibold text-white">Notifications</h1></div>
      <button onClick={onClose} aria-label="Close notification settings" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><CloseIcon className="h-6 w-6" /></button>
    </header>

    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-32">
      <div className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 ${enabled ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-slate-800 bg-slate-900'}`}><span className={`text-sm font-semibold ${enabled ? 'text-emerald-300' : 'text-slate-200'}`}>{status}</span><span className={`h-2.5 w-2.5 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} /></div>
      {state.requiresInstall && <p className="mb-5 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm leading-6 text-blue-100"><InformationCircleIcon className="mr-1 inline h-4 w-4" />Add DescoWise to your Home Screen from Safari, then open it there to enable notifications.</p>}
      {state.permission === 'denied' && <p className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm leading-6 text-rose-100"><ExclamationTriangleIcon className="mr-1 inline h-4 w-4" />Re-enable notifications in browser or device settings.</p>}

      {enabled && <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <button onClick={() => { setEditingTime(value => !value); setEditingAccounts(false); }} className="flex w-full items-center justify-between px-4 py-4 text-left"><span><span className="block font-medium text-white">Daily reminder</span><span className="mt-1 block text-sm text-slate-400">When to check your accounts</span></span><span className="text-sm font-semibold text-blue-300">{new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ›</span></button>
        {editingTime && <div className="border-t border-slate-800 px-4 py-4"><input type="time" value={time} onChange={event => setTime(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base font-medium text-white" /><p className="mt-2 text-xs text-slate-500">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p></div>}
        <button onClick={() => { setEditingAccounts(value => !value); setEditingTime(false); }} className="flex w-full items-center justify-between border-t border-slate-800 px-4 py-4 text-left"><span><span className="block font-medium text-white">Monitored accounts</span><span className="mt-1 block text-sm text-slate-400">{monitoredCount ? `${monitoredCount} selected` : 'None selected'}</span></span><span className="text-sm font-semibold text-blue-300">Manage ›</span></button>
        {editingAccounts && <div className="border-t border-slate-800 px-4 py-4"><label className="mb-4 flex items-center justify-between text-sm text-slate-300">Default threshold <span className="flex items-center gap-1">৳<input type="number" min="0" value={globalThreshold} onChange={event => setGlobalThreshold(Number(event.target.value))} className="w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-white" /></span></label><div className="space-y-2">{accounts.map(account => { const rule = watches[account.accountNo] || { enabled: false }; return <div key={account.accountNo} className="rounded-lg bg-slate-950/70 p-3"><div className="flex items-center gap-3"><input type="checkbox" checked={rule.enabled} onChange={event => setWatches(current => ({ ...current, [account.accountNo]: { ...rule, enabled: event.target.checked } }))} className="h-5 w-5 accent-blue-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{account.displayName || account.customerName || account.accountNo}</p><p className="text-xs text-slate-500">{account.accountNo}</p></div></div>{rule.enabled && <label className="mt-3 flex items-center justify-between text-xs text-slate-400">Alert below <span>৳ <input type="number" min="0" placeholder={String(globalThreshold)} value={rule.threshold ?? ''} onChange={event => { const value = event.target.value; setWatches(current => ({ ...current, [account.accountNo]: { ...rule, threshold: value ? Number(value) : undefined } })); }} className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-white" /></span></label>}</div>; })}</div></div>}
        <button onClick={() => void run(() => sendTestNotification(), 'Test notification sent.')} disabled={busy} className="flex w-full items-center justify-between border-t border-slate-800 px-4 py-4 text-left"><span><span className="block font-medium text-white">Test notification</span><span className="mt-1 block text-sm text-slate-400">Send a background-push test now</span></span><span className="text-sm font-semibold text-blue-300">Send ›</span></button>
      </div>}
      {message && <p className={`mt-4 rounded-lg px-3 py-2.5 text-sm ${message.toLowerCase().includes('wrong') || message.toLowerCase().includes('failed') ? 'bg-rose-500/10 text-rose-100' : 'bg-emerald-500/10 text-emerald-100'}`}>{message}</p>}
    </main>

    <footer className="shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3">
      {enabled ? <div className="flex items-center gap-3"><button onClick={() => void run(() => disablePushNotifications(), 'Notifications disabled.')} disabled={busy} className="px-1 text-sm font-medium text-slate-400 hover:text-rose-300">Disable</button><button onClick={() => void run(persist, 'Reminder settings saved.')} disabled={busy} className="ml-auto flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{busy ? <Spinner size="sm" /> : 'Save changes'}</button></div> : <button onClick={enable} disabled={busy || !state.supported || state.permission === 'denied' || state.requiresInstall} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{busy ? <Spinner size="sm" /> : 'Enable notifications'}</button>}
    </footer>
  </div>;
};

export default NotificationSettingsModal;
