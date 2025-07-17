import React from 'react';

type CurrentMonthBillForecastProps = {
  details: string;
  estimatedTotal: number | null;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  sanitizeCurrency: (amount: number) => number;
};

const CurrentMonthBillForecast: React.FC<CurrentMonthBillForecastProps> = ({ details, estimatedTotal, t, formatCurrency, sanitizeCurrency }) => (
  <div className="bg-orange-500/10 border border-orange-500/20 border-l-4 border-l-orange-400 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-orange-400 mb-1">{t('currentMonthBill')}</h4>
        <p className="text-sm text-orange-300">{details}</p>
        {estimatedTotal !== null && (
          <div className="mt-2 text-lg font-bold text-orange-200">
            {t('estimatedTotalBill')} {formatCurrency(sanitizeCurrency(estimatedTotal))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default CurrentMonthBillForecast; 