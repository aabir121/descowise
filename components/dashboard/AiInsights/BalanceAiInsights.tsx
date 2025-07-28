// @ts-nocheck
import React from 'react';
import { DistributedAiInsights } from '../../../utils/aiInsightDistribution';
import { formatCurrency } from '../../common/format';
import { WandSparklesIcon } from '../../common/Icons';

interface BalanceAiInsightsProps {
  insights: DistributedAiInsights['balance'];
  t: (key: string) => string;
}

const BalanceAiInsights: React.FC<BalanceAiInsightsProps> = ({ insights, t }) => {
  if (!insights || Object.keys(insights).length === 0) return null;

  const { balanceStatusAndAdvice, balanceDepletionForecast, rechargeRecommendation, rechargeTimingInsight } = insights;

  return (
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <WandSparklesIcon className="w-5 h-5 text-purple-400" />
        <h4 className="text-sm font-semibold text-purple-400">{t('aiInsights')}</h4>
      </div>
      
      <div className="space-y-3">
        {/* Balance Status */}
        {balanceStatusAndAdvice && (
          <div className={`rounded-lg p-3 border-l-4 ${
            balanceStatusAndAdvice.status === 'low' ? 'bg-red-500/10 border-red-500/20 border-l-red-400' :
            balanceStatusAndAdvice.status === 'normal' ? 'bg-yellow-500/10 border-yellow-500/20 border-l-yellow-400' :
            'bg-green-500/10 border-green-500/20 border-l-green-400'
          }`}>
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                balanceStatusAndAdvice.status === 'low' ? 'bg-red-400' :
                balanceStatusAndAdvice.status === 'normal' ? 'bg-yellow-400' :
                'bg-green-400'
              }`} />
              <div>
                <h5 className={`font-medium text-sm ${
                  balanceStatusAndAdvice.status === 'low' ? 'text-red-400' :
                  balanceStatusAndAdvice.status === 'normal' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {t('balanceStatus')}: {t(balanceStatusAndAdvice.status)}
                </h5>
                <p className="text-xs text-slate-300 mt-1">{balanceStatusAndAdvice.details}</p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Depletion Forecast */}
        {balanceDepletionForecast && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <h5 className="font-medium text-sm text-slate-200 mb-1">{t('balanceDepletion')}</h5>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-cyan-400 font-semibold">
                {balanceDepletionForecast.daysRemaining} {t('daysRemaining')}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">{balanceDepletionForecast.expectedDepletionDate}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{balanceDepletionForecast.details}</p>
          </div>
        )}

        {/* Recharge Recommendation */}
        {rechargeRecommendation && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
            <h5 className="font-medium text-sm text-cyan-400 mb-1">{t('rechargeRecommendation')}</h5>
            {rechargeRecommendation.recommendedAmountBDT && (
              <div className="text-lg font-bold text-cyan-300 mb-1">
                {formatCurrency(rechargeRecommendation.recommendedAmountBDT)}
              </div>
            )}
            <p className="text-xs text-slate-300">{rechargeRecommendation.justification}</p>
          </div>
        )}

        {/* Recharge Timing */}
        {rechargeTimingInsight && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <h5 className="font-medium text-sm text-slate-200 mb-1">{t('rechargeTimingInsight')}</h5>
            <p className="text-xs text-slate-300">{rechargeTimingInsight}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceAiInsights;
