import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { portalRequest, PortalRequestError } from '../services/descoPortalService';
import { clearRememberedLogin, hasRememberedLogin, loadRememberedLogin, saveRememberedLogin } from '../utils/descoRememberedLogin';

type AuthStatus = 'loading' | 'ready' | 'login' | 'error';

export default function DescoAuthGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(hasRememberedLogin);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const restoring = useRef(false);

  const restore = useCallback(async (sessionExpired = false) => {
    if (restoring.current) return;
    restoring.current = true;
    setStatus('loading');
    setError('');
    try {
      if (!sessionExpired) {
        const session = await portalRequest('/session');
        if (session?.authenticated) { setStatus('ready'); return; }
      }
      const saved = await loadRememberedLogin();
      if (!saved) {
        setRemember(false);
        setStatus('login');
        if (sessionExpired) setError(t('descoSessionExpired'));
        return;
      }
      try {
        await portalRequest('/login', { method: 'POST', body: JSON.stringify(saved) });
        setRemember(true);
        setStatus('ready');
      } catch (cause) {
        if (cause instanceof PortalRequestError && cause.status === 401) {
          await clearRememberedLogin().catch(() => {});
          setRemember(false);
          setError(t('descoSavedLoginFailed'));
          setStatus('login');
        } else {
          setError(cause instanceof Error ? cause.message : t('descoRetryConnection'));
          setStatus('error');
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('descoRetryConnection'));
      setStatus('error');
    } finally {
      restoring.current = false;
    }
  }, [t]);

  useEffect(() => {
    void restore();
    const expired = () => { void restore(true); };
    window.addEventListener('desco-session-expired', expired);
    return () => window.removeEventListener('desco-session-expired', expired);
  }, [restore]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await portalRequest('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (remember) {
        try { await saveRememberedLogin({ username, password }); }
        catch { await clearRememberedLogin().catch(() => {}); setRemember(false); setError(t('descoRememberFailed')); }
      } else {
        await clearRememberedLogin().catch(() => {});
      }
      setPassword('');
      setStatus('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('descoRetryConnection'));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await clearRememberedLogin().catch(() => {});
    setRemember(false);
    try {
      await portalRequest('/logout', { method: 'POST' });
      setStatus('login');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('descoRetryConnection'));
    }
  };

  if (status === 'loading') return <main className="p-8 text-center text-slate-200" role="status">{t('descoCheckingSession')}</main>;
  if (status === 'ready') return <>
    <button className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-700 px-4 py-2 text-white" onClick={signOut}>{t('descoSignOut')}</button>
    {error && <p role="alert" className="p-3 text-red-300">{error}</p>}
    {children}
  </>;

  return <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-slate-100">
    <form className="w-full max-w-sm space-y-5" onSubmit={signIn}>
      <h1 className="text-2xl font-bold">{t('descoSignIn')}</h1>
      <p className="text-sm text-slate-400">{t('descoSignInIntro')}</p>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {status === 'error' ? <button type="button" onClick={() => void restore()}>{t('descoRetryConnection')}</button> : <>
        <label className="block">{t('descoUsername')}<input required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-800 p-3" /></label>
        <label className="block">{t('descoPassword')}<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-800 p-3" /></label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <input type="checkbox" checked={remember} onChange={event => {
            setRemember(event.target.checked);
            if (!event.target.checked) void clearRememberedLogin().catch(() => {});
          }} className="mt-1 h-4 w-4 accent-cyan-400" />
          <span><strong className="block text-slate-100">{t('descoRememberHeadline')}</strong><span className="mt-1 block text-sm text-slate-400">{t('descoRememberDetails')}</span></span>
        </label>
        <button disabled={busy} className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950">{busy ? t('descoSigningIn') : t('descoSignIn')}</button>
      </>}
      <p className="border-t border-slate-700 pt-4 text-sm text-slate-300">{t('descoNoAccount')}{' '}<a href="https://prepaid.desco.org.bd/register" className="font-semibold text-cyan-300 underline underline-offset-4 hover:text-cyan-200">{t('descoCreateAccount')}</a></p>
    </form>
  </main>;
}
