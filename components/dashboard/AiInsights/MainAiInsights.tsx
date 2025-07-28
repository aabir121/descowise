// @ts-nocheck
import React from 'react';
import { DistributedAiInsights } from '../../../utils/aiInsightDistribution';
import { WandSparklesIcon, ExclamationTriangleIcon, LightBulbIcon } from '../../common/Icons';

interface MainAiInsightsProps {
  insights: DistributedAiInsights['main'];
  t: (key: string) => string;
}

const MainAiInsights: React.FC<MainAiInsightsProps> = ({ insights, t }) => {
  if (!insights || Object.keys(insights).length === 0) return null;

  const { title, overallSummary, criticalAnomalies, generalActionableTip } = insights;

  return (
    <div className="space-y-4">
      {/* Title and Overall Summary */}
      {(title || overallSummary) && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <WandSparklesIcon className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-semibold text-purple-400">{t('aiOverview')}</h4>
          </div>
          
          {title && (
            <h5 className="font-medium text-base text-slate-200 mb-2">{title}</h5>
          )}
          {overallSummary && (
            <p className="text-sm text-slate-300 leading-relaxed">{overallSummary}</p>
          )}
        </div>
      )}

      {/* Critical Anomalies - High Priority Alert */}
      {criticalAnomalies && criticalAnomalies.detected && (
        <div className="bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-base text-red-400 mb-2">
                {t('criticalAlert')}
              </h5>
              <p className="text-sm text-slate-300 leading-relaxed">
                {criticalAnomalies.details}
              </p>
              <div className="mt-3 px-3 py-2 bg-red-500/20 rounded-md">
                <p className="text-xs text-red-200 font-medium">
                  {t('immediateAttentionRequired')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Actionable Tip - Cross-cutting recommendations */}
      {generalActionableTip && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <LightBulbIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-sm text-cyan-400 mb-2">
                {t('keyRecommendation')}
              </h5>
              <p className="text-sm text-slate-300 leading-relaxed">
                {generalActionableTip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainAiInsights;
