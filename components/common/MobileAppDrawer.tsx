import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { BellIcon, BoltIcon, CloseIcon, InformationCircleIcon, WandSparklesIcon } from './Icons';
import { useDescoSignOut } from '../DescoAuthGate';

interface MobileAppDrawerProps {
  isOpen: boolean;
  accountCount: number;
  onClose: () => void;
  onOpenApiKeyModal: () => void;
  onOpenNotifications: () => void;
  onOpenHelp: () => void;
  languageSwitcher: React.ReactNode;
}

const MobileAppDrawer: React.FC<MobileAppDrawerProps> = ({
  isOpen,
  accountCount,
  onClose,
  onOpenApiKeyModal,
  onOpenNotifications,
  onOpenHelp,
  languageSwitcher,
}) => {
  const { t } = useTranslation();
  const signOut = useDescoSignOut();

  if (!isOpen) return null;

  const closeAfter = (action: () => void) => {
    action();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label={t('moreOptions', 'More options')}>
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label={t('close')} />
      <aside className="mobile-app-drawer absolute right-0 top-0 flex h-full w-[min(86vw,22rem)] flex-col border-l border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/70">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20"><BoltIcon className="h-5 w-5" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">DescoWise</p><p className="text-sm text-slate-400">{accountCount} {accountCount === 1 ? t('account') : t('accounts', 'accounts')}</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label={t('close')}><CloseIcon className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label={t('moreOptions', 'More options')}>
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('settings', 'Utilities')}</p>
          <button type="button" onClick={() => closeAfter(onOpenNotifications)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-slate-200 transition hover:bg-slate-800"><BellIcon className="h-5 w-5 text-cyan-300" /><span className="font-medium">{t('notificationSettings', 'Notifications')}</span></button>
          <button type="button" onClick={() => closeAfter(onOpenApiKeyModal)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-slate-200 transition hover:bg-slate-800"><WandSparklesIcon className="h-5 w-5 text-cyan-300" /><span className="font-medium">{t('aiSettings', 'AI settings')}</span></button>
          <button type="button" onClick={() => closeAfter(onOpenHelp)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-slate-200 transition hover:bg-slate-800"><InformationCircleIcon className="h-5 w-5 text-cyan-300" /><span className="font-medium">{t('help', 'Help')}</span></button>
          <div className="my-4 border-t border-slate-800" />
          <div className="rounded-2xl bg-slate-800/70 p-3">{languageSwitcher}</div>
          {signOut && (
            <button type="button" onClick={() => { signOut(); onClose(); }} className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-slate-700">
              <span>{t('descoSignOut')}</span>
              <span className="text-xs text-slate-500">↗</span>
            </button>
          )}
        </nav>

        <div className="border-t border-slate-800 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs leading-5 text-slate-500">{t('appSubtitle')}</div>
      </aside>
    </div>,
    document.body
  );
};

export default MobileAppDrawer;
