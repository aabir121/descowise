// @ts-nocheck
import React from 'react';
import { DistributedAiInsights } from '../../../utils/aiInsightDistribution';
import { formatCurrency } from '../../common/format';
import { WandSparklesIcon, ExclamationTriangleIcon } from '../../common/Icons';

interface ConsumptionAiInsightsProps {
  insights: DistributedAiInsights['consumption'];
  t: (key: string) => string;
}

const ConsumptionAiInsights: React.FC<ConsumptionAiInsightsProps> = ({ insights, t }) => {
  if (!insights || Object.keys(insights).length === 0) return null;

  const { minorAnomalies, seasonalTrend, currentMonthBillForecast, futureConsumptionForecast } = insights;

  return (
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <WandSparklesIcon className="w-5 h-5 text-purple-400" />
        <h4 className="text-sm font-semibold text-purple-400">{t('aiInsights')}</h4>
      </div>
      
      <div className="space-y-3">
        {/* Minor Anomaly Alert - Non-critical anomalies only */}
        {minorAnomalies?.detected && (
          <div className="bg-orange-500/10 border border-orange-500/20 border-l-4 border-l-orange-400 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-sm text-orange-400 mb-1">{t('usageAnomaly')}</h5>
                <p className="text-xs text-slate-300">{minorAnomalies.details}</p>
              </div>
            </div>
          </div>
        )}

        {/* Seasonal Trend */}
        {seasonalTrend && seasonalTrend.observed && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h5 className="font-medium text-sm text-blue-400 mb-1">{t('seasonalTrend')}</h5>
            <p className="text-xs text-slate-300">{seasonalTrend.details}</p>
          </div>
        )}

        {/* Current Month Bill Forecast */}
        {currentMonthBillForecast && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <h5 className="font-medium text-sm text-slate-200 mb-1">{t('currentMonthForecast')}</h5>
            <div className="text-lg font-bold text-cyan-300 mb-1">
              {formatCurrency(currentMonthBillForecast.estimatedTotal)}
            </div>
            <p className="text-xs text-slate-400">{currentMonthBillForecast.details}</p>
          </div>
        )}

        {/* Future Consumption Forecast */}
        {futureConsumptionForecast && futureConsumptionForecast.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <h5 className="font-medium text-sm text-slate-200 mb-2">{t('futureConsumptionForecast')}</h5>
            <div className="space-y-2">
              {futureConsumptionForecast.slice(0, 3).map((forecast) => (
                <div key={forecast.month} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">{forecast.month}</span>
                  <div className="flex gap-2">
                    <span className="text-cyan-400">{forecast.estimatedConsumption} kWh</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-green-400">{formatCurrency(forecast.estimatedBill)}</span>
                  </div>
                </div>
              ))}
              {futureConsumptionForecast.length > 3 && (
                <div className="text-xs text-slate-500 text-center pt-1">
                  +{futureConsumptionForecast.length - 3} {t('moreMonths')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionAiInsights;
