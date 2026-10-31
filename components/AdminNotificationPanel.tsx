import React, { useEffect, useMemo, useState } from 'react';
import { BellIcon, BoltIcon, CloseIcon } from './common/Icons';
import {
  getAdminNotificationOverview,
  runAdminAccountCheck,
  type AdminNotificationAccount,
  type AdminNotificationOverview,
} from '../services/adminNotificationService';

const PASSWORD_KEY = 'descowise_admin_session_password';

function time(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function amount(value: number | null): string {
  return value === null ? 'Not checked' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(value);
}

function status(account: AdminNotificationAccount): { label: string; tone: string } {
  if (account.failureCount > 0) return { label: `${account.failureCount} delivery issue${account.failureCount === 1 ? '' : 's'}`, tone: 'text-amber-300 bg-amber-400/10 border-amber-400/20' };
  if (!account.lastSuccessAt) return { label: 'Awaiting delivery', tone: 'text-slate-300 bg-slate-700/60 border-slate-600' };
  return { label: 'Healthy', tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' };
}

function attempt(account: AdminNotificationAccount): string {
  if (!account.lastAttemptAt) return 'No recorded check yet';
  const labels: Record<string, string> = {
    sent: 'Push accepted',
    failed: 'Push provider failed',
    expired_subscription: 'Subscription expired',
    skipped_above_threshold: 'Not needed (balance OK)',
    skipped_already_sent: 'Already sent today',
    balance_check_failed: 'DESCO balance check failed',
  };
  const label = labels[account.lastAttemptOutcome ?? ''] ?? 'Check completed';
  const provider = account.lastAttemptStatus ? ` (${account.lastAttemptStatus})` : '';
  return `${label}${provider} · ${time(account.lastAttemptAt)}`;
}

const AdminNotificationPanel: React.FC = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem(PASSWORD_KEY) ?? '');
  const [draftPassword, setDraftPassword] = useState('');
  const [overview, setOverview] = useState<AdminNotificationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [runAccount, setRunAccount] = useState<AdminNotificationAccount | null>(null);
  const [thresholdOverride, setThresholdOverride] = useState('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<string | null>(null);

  const load = async (adminPassword = password) => {
    if (!adminPassword) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminNotificationOverview(adminPassword);
      setOverview(result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load notification operations';
      setError(message);
      if (message === 'Unauthorized') {
        sessionStorage.removeItem(PASSWORD_KEY);
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const accounts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return overview?.accounts ?? [];
    return (overview?.accounts ?? []).filter((account) =>
      account.accountNo.includes(needle) || account.label?.toLowerCase().includes(needle) || account.deviceId.toLowerCase().includes(needle)
    );
  }, [overview, search]);

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draftPassword;
    if (!next) return;
    sessionStorage.setItem(PASSWORD_KEY, next);
    setPassword(next);
    void load(next);
  };

  const runCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!runAccount) return;
    const parsedOverride = thresholdOverride.trim() === '' ? undefined : Number(thresholdOverride);
    if (parsedOverride !== undefined && (!Number.isFinite(parsedOverride) || parsedOverride < 0 || parsedOverride > 1_000_000)) {
      setRunResult('Enter a threshold from ৳0 to ৳1,000,000.');
      return;
    }
    setRunningId(runAccount.subscriptionId);
    setRunResult(null);
    try {
      const result = await runAdminAccountCheck(password, runAccount.accountNo, runAccount.subscriptionId, parsedOverride);
      const resultText: Record<string, string> = {
        sent: 'Notification accepted by the push provider.',
        skipped_above_threshold: 'No notification: the live balance is above the threshold.',
        failed: 'The push provider rejected the notification.',
        expired_subscription: 'The device subscription has expired.',
      };
      setRunResult(`${runAccount.label || runAccount.accountNo}: ${resultText[result.outcome] ?? result.outcome} Live balance ${amount(result.balance)}; threshold ${amount(result.thresholdBdt)}.`);
      void load();
    } catch (caught) {
      setRunResult(caught instanceof Error ? caught.message : 'Account check failed');
    } finally {
      setRunningId(null);
    }
  };

  const openRunCheck = (account: AdminNotificationAccount) => {
    setRunAccount(account);
    setThresholdOverride('');
    setRunResult(null);
  };

  const signOut = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    setPassword('');
    setDraftPassword('');
    setOverview(null);
    setError(null);
  };

  if (!password) {
    return (
      <main className="min-h-[100dvh] bg-slate-950 px-5 py-[max(1.5rem,env(safe-area-inset-top))] text-slate-100 sm:flex sm:items-center sm:justify-center sm:p-8">
        <form onSubmit={signIn} className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center sm:min-h-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20"><BoltIcon className="h-6 w-6" /></span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300">DescoWise operations</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Notification admin</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Enter the administrator password to review opted-in accounts and run a live balance check for a single device.</p>
          <label htmlFor="admin-password" className="mt-8 text-sm font-semibold text-slate-200">Administrator password</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={draftPassword} onChange={(event) => setDraftPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4 text-slate-100 outline-none focus:border-cyan-400" placeholder="Enter password" />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button type="submit" className="mt-5 rounded-2xl bg-cyan-400 px-4 py-4 font-bold text-slate-950 transition hover:bg-cyan-300">Open admin panel</button>
          <p className="mt-4 text-xs leading-5 text-slate-500">The password is kept only until this browser session ends.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 px-5 py-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><BellIcon className="h-5 w-5" /></span>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Operations</p><h1 className="truncate text-xl font-bold text-white">Notification admin</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50">Refresh</button>
            <button onClick={signOut} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100" aria-label="Sign out"><CloseIcon className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Active devices', overview?.summary.activeDevices ?? 0],
            ['Notification rules', overview?.summary.monitoredRules ?? 0],
            ['Unique accounts', overview?.summary.uniqueAccounts ?? 0],
            ['Delivery issues', overview?.summary.devicesWithFailures ?? 0],
          ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs font-medium text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-100">{value}</p></div>)}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-xl font-bold text-white">Monitored accounts</h2><p className="mt-1 text-sm text-slate-400">The last scheduled check records whether a push was sent, skipped, or failed.</p></div>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search account, label, or device" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 sm:w-80" />
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {runAccount && <form onSubmit={runCheck} className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50"><div className="flex flex-col gap-4 lg:flex-row lg:items-end"><div className="min-w-0 flex-1"><p className="font-bold">Run live check: {runAccount.label || runAccount.accountNo}</p><p className="mt-1 leading-5 text-cyan-100/80">Uses the saved threshold unless you enter a temporary override. The override is not saved. A forced run bypasses the once-per-day guard but does not change the scheduled notification state.</p></div><label className="block lg:w-52"><span className="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Temporary threshold (BDT)</span><input type="number" min="0" max="1000000" inputMode="decimal" value={thresholdOverride} onChange={(event) => setThresholdOverride(event.target.value)} placeholder={`Saved: ${runAccount.thresholdBdt}`} className="mt-1 w-full rounded-xl border border-cyan-300/20 bg-slate-950/60 px-3 py-2.5 text-slate-100 outline-none focus:border-cyan-300" /></label><div className="flex gap-2"><button type="button" onClick={() => setRunAccount(null)} className="rounded-xl border border-cyan-300/20 px-3 py-2.5 font-semibold text-cyan-100 transition hover:bg-cyan-300/10">Cancel</button><button type="submit" disabled={runningId === runAccount.subscriptionId} className="rounded-xl bg-cyan-300 px-3 py-2.5 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{runningId === runAccount.subscriptionId ? 'Running…' : 'Run check'}</button></div></div></form>}
        {runResult && <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{runResult}</div>}

        <div className="mt-5 space-y-3 md:hidden">
          {accounts.map((account) => <AccountCard key={`${account.accountNo}-${account.subscriptionId}`} account={account} running={runningId === account.subscriptionId} onRun={openRunCheck} />)}
        </div>
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-800 md:block">
          <table className="w-full text-left text-sm"><thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4">Account</th><th className="px-5 py-4">Threshold</th><th className="px-5 py-4">Last balance</th><th className="px-5 py-4">Scheduled result</th><th className="px-5 py-4">Delivery</th><th className="px-5 py-4"></th></tr></thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950">{accounts.map((account) => <tr key={`${account.accountNo}-${account.subscriptionId}`}><td className="px-5 py-4"><p className="font-semibold text-slate-100">{account.label || account.accountNo}</p><p className="mt-1 font-mono text-xs text-slate-500">{account.accountNo} · {account.deviceId.slice(0, 8)}</p></td><td className="px-5 py-4 text-slate-300">{amount(account.thresholdBdt)}</td><td className="px-5 py-4 text-slate-300">{amount(account.lastBalance)}</td><td className="px-5 py-4 text-slate-400">{attempt(account)}</td><td className="px-5 py-4"><Status account={account} /></td><td className="px-5 py-4 text-right"><RunButton running={runningId === account.subscriptionId} onClick={() => openRunCheck(account)} /></td></tr>)}</tbody>
          </table>
        </div>
        {!loading && accounts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-sm text-slate-400">No notification-enabled accounts match this search.</div>}
        {loading && <p className="mt-8 text-center text-sm text-slate-400">Loading notification operations…</p>}
      </section>
    </main>
  );
};

const Status: React.FC<{ account: AdminNotificationAccount }> = ({ account }) => {
  const item = status(account);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.tone}`}>{item.label}</span>;
};

const RunButton: React.FC<{ running: boolean; onClick: () => void }> = ({ running, onClick }) => <button onClick={onClick} disabled={running} className="rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-50">{running ? 'Running…' : 'Run check'}</button>;

const AccountCard: React.FC<{ account: AdminNotificationAccount; running: boolean; onRun: (account: AdminNotificationAccount) => void }> = ({ account, running, onRun }) => (
  <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-100">{account.label || account.accountNo}</h3><p className="mt-1 font-mono text-xs text-slate-500">{account.accountNo} · {account.deviceId.slice(0, 8)}</p></div><Status account={account} /></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Threshold</dt><dd className="mt-1 font-medium text-slate-200">{amount(account.thresholdBdt)}</dd></div><div><dt className="text-xs text-slate-500">Last balance</dt><dd className="mt-1 font-medium text-slate-200">{amount(account.lastBalance)}</dd></div><div className="col-span-2"><dt className="text-xs text-slate-500">Last scheduled result</dt><dd className="mt-1 text-slate-300">{attempt(account)}</dd></div></dl>
    <RunButton running={running} onClick={() => onRun(account)} />
  </article>
);

export default AdminNotificationPanel;
