import React from 'react';

type ForecastItem = {
  month: string;
  estimatedConsumption: number | null;
  estimatedBill: number;
};

type FutureConsumptionForecastProps = {
  forecast: ForecastItem[];
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  sanitizeCurrency: (amount: number) => number;
};

const FutureConsumptionForecast: React.FC<FutureConsumptionForecastProps> = ({ forecast, t, formatCurrency, sanitizeCurrency }) => (
  <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-cyan-400 mb-1">{t('next3Months')}</h4>
        <table className="min-w-full text-sm text-cyan-200 mt-2">
          <thead>
            <tr>
              <th className="pr-4 text-left">{t('month')}</th>
              <th className="pr-4 text-left">{t('estConsumption')}</th>
              <th className="pr-4 text-left">{t('estBill')}</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((f, idx) => (
              <tr key={f.month || idx}>
                <td className="pr-4">{f.month}</td>
                <td className="pr-4">{f.estimatedConsumption !== null ? f.estimatedConsumption.toLocaleString() : '-'}</td>
                <td className="pr-4">{formatCurrency(sanitizeCurrency(f.estimatedBill))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default FutureConsumptionForecast; 