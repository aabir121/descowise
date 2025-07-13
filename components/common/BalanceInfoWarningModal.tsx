import React from 'react';
import Modal from './Modal';
import { InformationCircleIcon } from './Icons';
import { useTranslation } from 'react-i18next';

interface BalanceInfoWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BalanceInfoWarningModal: React.FC<BalanceInfoWarningModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2 sm:px-0" onClick={handleModalClick}>
      <div className="flex flex-col w-full max-w-xs sm:max-w-md md:max-w-lg bg-slate-800 rounded-2xl shadow-2xl my-4 mx-auto">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-6 h-6 text-yellow-400" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-100">{t('balanceInfoUnavailableTitle')}</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-700 transition-colors ml-2"
            aria-label={t('close')}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="text-slate-300 text-sm sm:text-base space-y-4">
            <div>
              <p className="mb-2">{t('balanceInfoUnavailableDesc')}</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>{t('balanceInfoReasonMaintenance')}</li>
                <li>{t('balanceInfoReasonStatus')}</li>
                <li>{t('balanceInfoReasonNetwork')}</li>
                <li>{t('balanceInfoReasonMeter')}</li>
              </ul>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-lg mt-2">
              <p className="font-semibold text-slate-200 mb-2">{t('balanceInfoWhatToDoTitle')}</p>
              <ul className="list-disc list-inside space-y-1 ml-3 text-slate-300">
                <li>{t('balanceInfoActionCheckMeter')}</li>
                <li>{t('balanceInfoActionCallDesco', { phone1: '16260', phone2: '02-955-9555' })}</li>
                <li>{t('balanceInfoActionVisitPortal')}</li>
                <li>{t('balanceInfoActionWait')}</li>
              </ul>
            </div>
            <p className="text-slate-400 text-xs sm:text-[13px] mt-2">
              {t('balanceInfoAutoUpdate')}
            </p>
          </div>
        </div>
        {/* Fixed Footer */}
        <div className="flex justify-end sm:justify-end px-4 py-3 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-100 rounded-lg text-sm font-semibold transition-colors"
            style={{ minHeight: 44 }}
          >
            {t('gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceInfoWarningModal; 