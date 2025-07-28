// @ts-nocheck
import React from 'react';
import { DistributedAiInsights } from '../../../utils/aiInsightDistribution';
import { WandSparklesIcon, LightBulbIcon } from '../../common/Icons';

interface RechargeAiInsightsProps {
  insights: DistributedAiInsights['recharge'];
  t: (key: string) => string;
}

const RechargeAiInsights: React.FC<RechargeAiInsightsProps> = ({ insights, t }) => {
  if (!insights || Object.keys(insights).length === 0) return null;

  const { rechargePatternInsight, rechargeSpecificTips } = insights;

  return (
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <WandSparklesIcon className="w-5 h-5 text-purple-400" />
        <h4 className="text-sm font-semibold text-purple-400">{t('aiInsights')}</h4>
      </div>
      
      <div className="space-y-3">
        {/* Recharge Pattern Insight */}
        {rechargePatternInsight && (
          <div className="bg-slate-700/30 rounded-lg p-3">
            <h5 className="font-medium text-sm text-slate-200 mb-1">{t('rechargePattern')}</h5>
            <p className="text-xs text-slate-300">{rechargePatternInsight}</p>
          </div>
        )}

        {/* Recharge-Specific Tips */}
        {rechargeSpecificTips && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <LightBulbIcon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-sm text-cyan-400 mb-1">{t('rechargeOptimizationTip')}</h5>
                <p className="text-xs text-slate-300">{rechargeSpecificTips}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeAiInsights;
