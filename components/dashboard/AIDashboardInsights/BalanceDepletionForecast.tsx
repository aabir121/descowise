import React from 'react';

type BalanceDepletionForecastProps = {
  details: string;
  daysRemaining: number | null;
  expectedDepletionDate?: string;
  t: (key: string) => string;
};

const BalanceDepletionForecast: React.FC<BalanceDepletionForecastProps> = ({ details, daysRemaining, expectedDepletionDate, t }) => (
  <div className="bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-400 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-red-400 mb-1">{t('balanceDepletion')}</h4>
        <p className="text-sm text-red-300">{details}</p>
        {daysRemaining !== null && (
          <div className="mt-2 text-lg font-bold text-red-200">
            {t('estimatedDays')} {daysRemaining}
          </div>
        )}
        {expectedDepletionDate && (
          <div className="text-sm text-red-200">
            {t('expectedDepletionDate')} {expectedDepletionDate}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default BalanceDepletionForecast; 