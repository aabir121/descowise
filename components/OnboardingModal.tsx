import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BoltIcon, CloseIcon, GlobeAltIcon } from './common/Icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageSelect: (language: 'en' | 'bn') => void;
}

/**
 * First-run onboarding is deliberately a focused welcome screen rather than a
 * scrollable product-tour modal. On phones it fills the app surface; on larger
 * screens it becomes a compact dialog.
 */
const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onLanguageSelect }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'bn'>(
    i18n.language.startsWith('bn') ? 'bn' : 'en'
  );

  useEffect(() => {
    setSelectedLanguage(i18n.language.startsWith('bn') ? 'bn' : 'en');
  }, [i18n.language]);

  if (!isOpen) return null;

  const selectLanguage = (language: 'en' | 'bn') => {
    setSelectedLanguage(language);
    onLanguageSelect(language);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 sm:flex sm:items-center sm:justify-center sm:bg-slate-950/80 sm:p-6 sm:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <main className="flex min-h-[100dvh] w-full flex-col bg-slate-950 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:min-h-0 sm:max-w-md sm:rounded-3xl sm:border sm:border-slate-700 sm:bg-slate-900 sm:p-7 sm:shadow-2xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
              <BoltIcon className="h-6 w-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">DescoWise</span>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label={t('onboarding.skip', 'Skip welcome')}
          >
            <span className="sm:hidden">{t('onboarding.skip', 'Skip')}</span>
            <CloseIcon className="hidden h-5 w-5 sm:block" />
          </button>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10 sm:py-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
            {t('onboarding.eyebrow', 'Your DESCO companion')}
          </p>
          <h1 id="welcome-title" className="max-w-sm text-4xl font-bold tracking-tight text-white sm:text-3xl">
            {t('onboardingTitle')}
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-slate-400">
            {t('onboarding.mobileIntro', 'Add an account, see your balance clearly, and stay ahead of low credit.')}
          </p>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
              <GlobeAltIcon className="h-4 w-4 text-cyan-300" />
              {t('onboarding.languageLabel', 'Choose language')}
            </div>
            <div className="grid grid-cols-2 rounded-2xl bg-slate-900 p-1.5 ring-1 ring-inset ring-slate-800">
              {(['en', 'bn'] as const).map((language) => {
                const isSelected = selectedLanguage === language;
                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => selectLanguage(language)}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {language === 'en' ? 'English' : 'বাংলা'}
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            {[
              t('onboarding.benefitAccounts', 'Keep your DESCO accounts in one place'),
              t('onboarding.benefitBalance', 'Understand balance and usage at a glance'),
              t('onboarding.benefitPrivacy', 'Your Gemini API key stays on this device')
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        <footer className="space-y-4 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-cyan-400 px-5 py-4 text-base font-bold text-slate-950 transition-colors hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {t('onboarding.continue', 'Continue to DescoWise')}
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">
            {t('onboarding.apiKeyLater', 'You can set up optional AI insights later from Settings.')}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default OnboardingModal;
