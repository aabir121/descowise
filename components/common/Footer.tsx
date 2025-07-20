import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer className="w-full bg-slate-900/95 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-2 backdrop-blur-md">
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
            <div className="mb-4 text-slate-300 text-sm bg-slate-700/60 rounded p-3">
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