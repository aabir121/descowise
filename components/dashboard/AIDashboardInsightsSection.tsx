// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import { WandSparklesIcon } from '../common/Icons';
import { formatCurrency, sanitizeCurrency } from '../common/format';

const AIDashboardInsightsSection = ({ aiSummary, isAiLoading, isAiAvailable, banglaEnabled, balanceUnavailable, t }) => {
  // Timeout handling for long waits
  const [waitedLong, setWaitedLong] = useState(false);
  useEffect(() => {
    if (isAiLoading) {
      const timer = setTimeout(() => setWaitedLong(true), 30000); // 30 seconds
      return () => clearTimeout(timer);
    } else {
      setWaitedLong(false);
    }
  }, [isAiLoading]);

  // Tips array using translation keys
  const tips = [t('tip1'), t('tip2'), t('tip3')];
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * tips.length));
  useEffect(() => {
    if (isAiLoading) {
      setTipIdx(Math.floor(Math.random() * tips.length));
    }
  }, [isAiLoading]);
  const randomTip = tips[tipIdx];

  if (!isAiAvailable) return null;
  return (
    <Section title={t('aiInsights')} defaultOpen={true} sectionId="ai-powered-insights" alwaysExpanded={true}>
      {isAiLoading ? (
        <div className="flex flex-col items-start gap-3 text-slate-400">
          <div className="flex items-center gap-3">
            <Spinner size="w-6 h-6 animate-spin" color="border-slate-400" />
            <span>
              <strong>{t('aiAnalysisGenerating')}</strong>
              <br />
              {t('aiAnalysisMayTakeTime')}
              <br />
              <span className="text-xs">{t('aiAnalysisUsuallyTakes')}</span>
            </span>
          </div>
          <div className="mt-2 text-slate-500 italic">
            {waitedLong
              ? <>{t('aiAnalysisStillWorking')}<br /><button className="underline text-cyan-400 hover:text-cyan-300" onClick={() => window.location.reload()}>{t('tryAgain')}</button></>
              : randomTip}
          </div>
        </div>
      ) : !aiSummary ? (
        <div className="text-slate-400">{t('couldNotGenerate')}</div>
      ) : (
        <div className="space-y-6">
          {/* Balance Unavailable Notice */}
          {balanceUnavailable && (
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
          )}
          {/* Header */}
          <div className="flex items-start gap-3">
            <WandSparklesIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{aiSummary.title}</h3>
              <p className="text-slate-300 mb-4">{aiSummary.overallSummary}</p>
            </div>
          </div>
          {/* 8. Balance Depletion Forecast */}
          {!balanceUnavailable && aiSummary.balanceDepletionForecast && (
            <div className="bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-400 mb-1">{t('balanceDepletion')}</h4>
                  <p className="text-sm text-red-300">{aiSummary.balanceDepletionForecast.details}</p>
                  {aiSummary.balanceDepletionForecast.daysRemaining !== null && (
                    <div className="mt-2 text-lg font-bold text-red-200">
                      {t('estimatedDays')} {aiSummary.balanceDepletionForecast.daysRemaining}
                    </div>
                  )}
                  {aiSummary.balanceDepletionForecast.expectedDepletionDate && (
                    <div className="text-sm text-red-200">
                      {t('expectedDepletionDate')} {aiSummary.balanceDepletionForecast.expectedDepletionDate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* 9. Current Month Bill Forecast */}
          {aiSummary.currentMonthBillForecast && (
            <div className="bg-orange-500/10 border border-orange-500/20 border-l-4 border-l-orange-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-400 mb-1">{t('currentMonthBill')}</h4>
                  <p className="text-sm text-orange-300">{aiSummary.currentMonthBillForecast.details}</p>
                  {aiSummary.currentMonthBillForecast.estimatedTotal !== null && (
                    <div className="mt-2 text-lg font-bold text-orange-200">
                      {t('estimatedTotalBill')} {formatCurrency(sanitizeCurrency(aiSummary.currentMonthBillForecast?.estimatedTotal))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* 10. Future Consumption Forecast */}
          {aiSummary.futureConsumptionForecast && (
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
                      {aiSummary.futureConsumptionForecast.map((f, idx) => (
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
          )}
          {/* 1. Balance Status and Advice */}
          {aiSummary.balanceStatusAndAdvice && (
            <div className={`rounded-lg p-4 border-l-4 ${
              aiSummary.balanceStatusAndAdvice?.status === 'low' ? 'bg-red-500/10 border-red-500/20 border-l-red-400' :
              aiSummary.balanceStatusAndAdvice?.status === 'normal' ? 'bg-yellow-500/10 border-yellow-500/20 border-l-yellow-400' :
              'bg-green-500/10 border-green-500/20 border-l-green-400'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  aiSummary.balanceStatusAndAdvice?.status === 'low' ? 'bg-red-400' :
                  aiSummary.balanceStatusAndAdvice?.status === 'normal' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`} />
                <div>
                  <h4 className={`font-semibold mb-1 ${
                    aiSummary.balanceStatusAndAdvice?.status === 'low' ? 'text-red-400' :
                    aiSummary.balanceStatusAndAdvice?.status === 'normal' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {t('balanceStatus')}: {aiSummary.balanceStatusAndAdvice?.status ? (
                      t(
                        aiSummary.balanceStatusAndAdvice.status === 'low'
                          ? 'statusLow'
                          : aiSummary.balanceStatusAndAdvice.status === 'normal'
                          ? 'statusNormal'
                          : aiSummary.balanceStatusAndAdvice.status === 'good'
                          ? 'statusGood'
                          : 'statusUnknown'
                      )
                    ) : t('statusUnknown')}
                  </h4>
                  <p className="text-sm text-slate-300">{aiSummary.balanceStatusAndAdvice?.details}</p>
                </div>
              </div>
            </div>
          )}
          {/* 2. Suggested Recharge Amount (now rechargeRecommendation) */}
          {aiSummary.rechargeRecommendation && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-1">{t('recommendedRecharge')}</h4>
                  <p className="text-sm text-cyan-300">{aiSummary.rechargeRecommendation.details}</p>
                  {aiSummary.rechargeRecommendation.amount !== null && (
                    <div className="mt-2 text-lg font-bold text-cyan-200">
                      {t('suggestedRechargeAmount')} {formatCurrency(sanitizeCurrency(aiSummary.rechargeRecommendation.amount))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* 3. Recharge Timing Insight */}
          {aiSummary.rechargeTimingInsight && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 border-l-4 border-l-indigo-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-indigo-400 mb-1">{t('optimalRechargeTiming')}</h4>
                  <p className="text-sm text-indigo-300">{aiSummary.rechargeTimingInsight}</p>
                </div>
              </div>
            </div>
          )}
          {/* 4. Anomaly Alert */}
          {aiSummary.anomaly && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-400 mb-1">{t('anomalyDetected')}</h4>
                  <p className="text-sm text-amber-300">{aiSummary.anomaly.details}</p>
                </div>
              </div>
            </div>
          )}
          {/* 5. Seasonal Trend */}
          {aiSummary.seasonalTrend && aiSummary.seasonalTrend.observed && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-400 mb-1">{t('seasonalPattern')}</h4>
                  <p className="text-sm text-blue-300">{aiSummary.seasonalTrend.details}</p>
                </div>
              </div>
            </div>
          )}
          {/* 6. Recharge Pattern Insight */}
          {aiSummary.rechargePatternInsight && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-200 mb-2">{t('rechargePattern')}</h4>
              <p className="text-sm text-slate-300">{aiSummary.rechargePatternInsight}</p>
            </div>
          )}
          {/* 7. Actionable Tip */}
          {aiSummary.actionableTip && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-400 mb-1">{t('actionableTip')}</h4>
                <p className="text-sm text-purple-300">{aiSummary.actionableTip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
};

export default AIDashboardInsightsSection; 