import React from 'react';
import { useTranslation } from 'react-i18next';
import { BoltIcon, CloseIcon, InformationCircleIcon, ShareIcon, WandSparklesIcon } from './Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal?: () => void;
}

/** A deliberately compact help centre. Detailed product tours belong in documentation, not in-app first-line help. */
const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onOpenApiKeyModal }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const topics = [
    {
      title: t('helpAddAccountTitle', 'Add an account'),
      description: t('helpAddAccountDescription', 'Tap the + button, enter the DESCO account number from the bill, then confirm the account we find.'),
      icon: BoltIcon,
    },
    {
      title: t('helpBalanceTitle', 'Check balance and usage'),
      description: t('helpBalanceDescription', 'Tap an account card to see its balance, recent usage, recharge history, and forecasts. DESCO data can take time to refresh.'),
      icon: InformationCircleIcon,
    },
    {
      title: t('helpNotificationsTitle', 'Receive low-balance alerts'),
      description: t('helpNotificationsDescription', 'Open the bell icon, enable notifications, select the accounts to monitor, and set a balance threshold. We check after DESCO’s nightly refresh.'),
      icon: BoltIcon,
    },
    {
      title: t('helpSharingTitle', 'Share an account'),
      description: t('helpSharingDescription', 'Use the share icon on an account card. Send the link only to people you trust; anyone with it can view that shared account.'),
      icon: ShareIcon,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 sm:flex sm:items-center sm:justify-center sm:bg-black/80 sm:p-4 sm:backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <section className="flex h-[100dvh] w-full min-h-0 flex-col bg-slate-900 sm:h-[min(42rem,86vh)] sm:max-w-xl sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-700 sm:shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-700 px-5 py-[max(1rem,env(safe-area-inset-top))] sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><InformationCircleIcon className="h-5 w-5" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">DescoWise</p><h2 id="help-title" className="mt-0.5 text-xl font-bold text-white">{t('helpAndGuidance', 'Help & guidance')}</h2></div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100" aria-label={t('close', 'Close')}><CloseIcon className="h-6 w-6" /></button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-5">
          <div className="mx-auto max-w-md">
            <h3 className="text-2xl font-bold tracking-tight text-slate-50">{t('helpQuickTitle', 'How can we help?')}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t('helpQuickIntro', 'Start with these common tasks. Tap a topic for the quick answer.')}</p>

            <div className="mt-6 space-y-3">
              {topics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <details key={topic.title} className="group rounded-2xl border border-slate-700 bg-slate-950/40 px-4 transition open:border-cyan-400/30 open:bg-cyan-400/5">
                    <summary className="flex cursor-pointer list-none items-center gap-3 py-4 text-sm font-semibold text-slate-100 marker:hidden">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-300 group-open:bg-cyan-400/10"><Icon className="h-4 w-4" /></span>
                      <span className="flex-1">{topic.title}</span>
                      <span className="text-lg text-slate-500 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="border-t border-slate-700/70 pb-4 pt-3 text-sm leading-6 text-slate-400">{topic.description}</p>
                  </details>
                );
              })}
            </div>

            <section className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
              <div className="flex gap-3"><WandSparklesIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" /><div><h4 className="font-semibold text-slate-100">{t('helpAiTitle', 'Optional AI insights')}</h4><p className="mt-1 text-sm leading-6 text-slate-400">{t('helpAiDescription', 'Add your Gemini API key only if you want personalised insights. Your key stays on this device.')}</p>{onOpenApiKeyModal && <button onClick={() => { onClose(); onOpenApiKeyModal(); }} className="mt-3 text-sm font-bold text-violet-200 transition hover:text-violet-100">{t('helpAiAction', 'Set up AI insights')} →</button>}</div></div>
            </section>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">{t('helpDataNote', 'For critical balance information, always verify it with DESCO or your meter.')}</p>
          </div>
        </main>
      </section>
    </div>
  );
};

export default HelpModal;
