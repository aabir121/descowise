import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer className="sticky bottom-0 w-full bg-slate-900/95 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-2 backdrop-blur-md z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center flex-1 gap-1 sm:gap-2">
          <span>{t('footerLine1')}</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>{t('footerLine2')}</span>
          <span className="hidden sm:inline">&middot;</span>
          <button
            className="underline hover:text-cyan-400 focus:outline-none ml-0 sm:ml-1"
            onClick={() => setShowModal(true)}
            aria-label={t('privacyAndDisclaimer')}
          >
            {t('privacy')}
          </button>
        </div>
      </footer>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 relative m-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{t('privacyAndDisclaimer')}</h2>
            <div className="mb-4 text-slate-300 text-sm space-y-4">
              {/* General Privacy */}
              <div className="bg-slate-700/60 rounded p-3">
                <p className="mb-2">
                  <Trans
                    i18nKey="privacyDisclaimer1"
                    values={{ affiliation: t('privacyDisclaimer1_affiliation') }}
                    components={{ bold: <b /> }}
                  />
                </p>
                <p className="mb-2">
                  <Trans
                    i18nKey="privacyDisclaimer2"
                    values={{ storage: t('privacyDisclaimer2_storage') }}
                    components={{ bold: <b /> }}
                  />
                </p>
                <p className="mb-2"><Trans i18nKey="privacyDisclaimer3" /></p>
                <p className="text-xs text-slate-500 mt-2"><Trans i18nKey="privacyDisclaimer4" /></p>
              </div>

              {/* API Key Security */}
              <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-cyan-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-cyan-200">{t('apiKeySecurityTitle')}</h4>
                </div>
                <div className="text-cyan-100 space-y-1">
                  <p className="text-xs">{t('apiKeySecurityDesc1')}</p>
                  <p className="text-xs">{t('apiKeySecurityDesc2')}</p>
                  <p className="text-xs">{t('apiKeySecurityDesc3')}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white font-semibold" onClick={() => setShowModal(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer; 