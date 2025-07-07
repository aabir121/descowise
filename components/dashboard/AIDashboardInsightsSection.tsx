// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import { WandSparklesIcon } from '../common/Icons';

const AIDashboardInsightsSection = ({ aiSummary, isAiLoading, isAiAvailable }) => {
  if (!isAiAvailable) return null;
  return (
    <Section title="AI-Powered Insights" defaultOpen>
      {isAiLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <Spinner size="w-6 h-6" color="border-slate-400" />
          <span>Generating your personalized summary...</span>
        </div>
      ) : !aiSummary ? (
        <div className="text-slate-400">Could not generate AI summary.</div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <WandSparklesIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{aiSummary.title}</h3>
              <p className="text-slate-300 mb-4">{aiSummary.overallSummary}</p>
            </div>
          </div>
          {/* 1. Balance Status and Advice */}
          <div className={`rounded-lg p-4 border-l-4 ${
            aiSummary.balanceStatusAndAdvice.status === 'low' ? 'bg-red-500/10 border-red-500/20 border-l-red-400' :
            aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'bg-yellow-500/10 border-yellow-500/20 border-l-yellow-400' :
            'bg-green-500/10 border-green-500/20 border-l-green-400'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                aiSummary.balanceStatusAndAdvice.status === 'low' ? 'bg-red-400' :
                aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'bg-yellow-400' :
                'bg-green-400'
              }`} />
              <div>
                <h4 className={`font-semibold mb-1 ${
                  aiSummary.balanceStatusAndAdvice.status === 'low' ? 'text-red-400' :
                  aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  Balance Status: {aiSummary.balanceStatusAndAdvice.status.charAt(0).toUpperCase() + aiSummary.balanceStatusAndAdvice.status.slice(1)}
                </h4>
                <p className="text-sm text-slate-300">{aiSummary.balanceStatusAndAdvice.details}</p>
              </div>
            </div>
          </div>
          {/* 2. Suggested Recharge Amount */}
          {aiSummary.suggestedRechargeAmount.amountBDT && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-1">💰 Recommended Recharge</h4>
                  <p className="text-2xl font-bold text-cyan-300 mb-2">৳{aiSummary.suggestedRechargeAmount.amountBDT.toLocaleString()}</p>
                  <p className="text-sm text-cyan-300">{aiSummary.suggestedRechargeAmount.justification}</p>
                </div>
              </div>
            </div>
          )}
          {/* 3. Recharge Timing Insight */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 border-l-4 border-l-indigo-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-indigo-400 mb-1">⏰ Optimal Recharge Timing</h4>
                <p className="text-sm text-indigo-300">{aiSummary.rechargeTimingInsight}</p>
              </div>
            </div>
          </div>
          {/* 4. Anomaly Alert */}
          {aiSummary.anomaly.detected && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-400 mb-1">⚠️ Anomaly Detected</h4>
                  <p className="text-sm text-amber-300">{aiSummary.anomaly.details}</p>
                </div>
              </div>
            </div>
          )}
          {/* 5. Seasonal Trend */}
          {aiSummary.seasonalTrend.observed && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-400 mb-1">🌡️ Seasonal Pattern</h4>
                  <p className="text-sm text-blue-300">{aiSummary.seasonalTrend.details}</p>
                </div>
              </div>
            </div>
          )}
          {/* 6. Recharge Pattern Insight */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="font-semibold text-slate-200 mb-2">📊 Recharge Pattern Analysis</h4>
            <p className="text-sm text-slate-300">{aiSummary.rechargePatternInsight}</p>
          </div>
          {/* 7. Actionable Tip */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-400 mb-1">💡 Actionable Tip</h4>
                <p className="text-sm text-purple-300">{aiSummary.actionableTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
};

export default AIDashboardInsightsSection; 