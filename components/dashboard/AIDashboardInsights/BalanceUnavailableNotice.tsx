import React from 'react';

type BalanceUnavailableNoticeProps = {
  t: (key: string) => string;
};

const BalanceUnavailableNotice: React.FC<BalanceUnavailableNoticeProps> = ({ t }) => (
  <div className="bg-yellow-500/10 border border-yellow-500/20 border-l-4 border-l-yellow-400 rounded-lg p-4 mb-6">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-yellow-400 mb-2">{t('balanceUnavailableLabel')}</h4>
        <p className="text-sm text-yellow-300 mb-3">
          {t('balanceUnavailableMsg')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">💡</span>
            <span className="text-yellow-200">{t('checkMeter')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">📞</span>
            <span className="text-yellow-200">{t('contactDesco')}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default BalanceUnavailableNotice; 