import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '../../types';
import { CheckIcon, CloseIcon, CopyIcon, ShareIcon } from './Icons';
import { useModal } from '../../App';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, account }) => {
  const { t } = useTranslation();
  const Modal = useModal();
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(
    () => `${window.location.origin}/dashboard/${account.accountNo}?shared=1&ref=share`,
    [account.accountNo]
  );
  const accountLabel = account.displayName || account.customerName || `${t('account')} ${account.accountNo}`;
  const shareTitle = t('shareAccountTitle', { accountName: accountLabel, defaultValue: `DESCO account: ${accountLabel}` });
  const shareText = t('shareAccountText', {
    accountName: accountLabel,
    defaultValue: `View the DESCO account “${accountLabel}” in DescoWise.`
  });

  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is not available in every embedded browser.
      window.prompt(t('copyShareLink', 'Copy this link'), shareUrl);
    }
  };

  const share = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (error) {
        // Cancelling the system share sheet is not an application error.
        if ((error as DOMException).name !== 'AbortError') console.error('Unable to share account', error);
      }
      return;
    }
    await copyLink();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} mobileFullscreen>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-700 px-5 py-[max(1rem,env(safe-area-inset-top))] sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <ShareIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{t('shareAccount', 'Share account')}</p>
              <h2 className="mt-0.5 text-xl font-bold text-white">{t('shareDashboard')}</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100" aria-label={t('closeModal')}>
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 px-5 py-8 sm:p-6">
          <div className="mx-auto w-full max-w-md">
            <h3 className="text-2xl font-bold tracking-tight text-slate-50">{t('shareAccountHeading', 'Share access with someone you trust')}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{t('shareAccountIntro', 'They can open the latest account information from this link. They can choose to add it to their own dashboard or just view it.')}</p>

            <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <p className="text-base font-semibold text-slate-100">{accountLabel}</p>
              <p className="mt-1 text-sm text-slate-400">{t('accountNumber')}: {account.accountNo}</p>
              {account.meterNo && <p className="mt-1 text-sm text-slate-400">{t('meterNumber')}: {account.meterNo}</p>}
            </section>

            <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-100">
              {t('sharePrivacyNote', 'Only share this link with people you trust. Anyone with the link can view this account.')}
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-700 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:p-5">
          <div className="mx-auto grid w-full max-w-md gap-3">
            <button onClick={share} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-4 text-base font-bold text-slate-950 transition hover:bg-cyan-300">
              <ShareIcon className="h-5 w-5" />
              {typeof navigator.share === 'function' ? t('shareViaSystem', 'Share') : t('copyLink')}
            </button>
            <button onClick={copyLink} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-600 px-4 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700">
              {copied ? <CheckIcon className="h-5 w-5 text-emerald-300" /> : <CopyIcon className="h-5 w-5" />}
              {copied ? t('linkCopied') : t('copyLink')}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
};

export default ShareModal;
