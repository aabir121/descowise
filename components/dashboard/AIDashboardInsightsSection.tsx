// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import { WandSparklesIcon } from '../common/Icons';
import { formatCurrency, sanitizeCurrency } from '../common/format';

const AIDashboardInsightsSection = ({ aiSummary, isAiLoading, isAiAvailable, banglaEnabled }) => {
  if (!isAiAvailable) return null;
  // Define all section labels in both English and Bangla
  const labels = {
    aiInsights: banglaEnabled ? 'এআই-চালিত বিশ্লেষণ' : 'AI-Powered Insights',
    generating: banglaEnabled ? 'আপনার জন্য ব্যক্তিগত সারাংশ তৈরি হচ্ছে...' : 'Generating your personalized summary...',
    couldNotGenerate: banglaEnabled ? 'এআই সারাংশ তৈরি করা যায়নি।' : 'Could not generate AI summary.',
    balanceDepletion: banglaEnabled ? '⏳ ব্যালেন্স শেষ হওয়ার পূর্বাভাস' : '⏳ Balance Depletion Forecast',
    estimatedDays: banglaEnabled ? 'আনুমানিক দিন বাকি:' : 'Estimated Days Remaining:',
    expectedDepletionDate: banglaEnabled ? 'প্রত্যাশিত শেষ হওয়ার তারিখ:' : 'Expected Depletion Date:',
    currentMonthBill: banglaEnabled ? '📅 এই মাসের আনুমানিক বিল' : '📅 Estimated Bill for This Month',
    estimatedTotalBill: banglaEnabled ? 'আনুমানিক মোট বিল:' : 'Estimated Total Bill:',
    next3Months: banglaEnabled ? '🔮 আগামী ৩ মাসের পূর্বাভাস' : '🔮 Next 3 Months Forecast',
    month: banglaEnabled ? 'মাস' : 'Month',
    estConsumption: banglaEnabled ? 'আনুমানিক খরচ (কিলোওয়াট-ঘণ্টা)' : 'Est. Consumption (kWh)',
    estBill: banglaEnabled ? 'আনুমানিক বিল (৳)' : 'Est. Bill (৳)',
    balanceStatus: banglaEnabled ? 'ব্যালেন্স অবস্থা' : 'Balance Status',
    recommendedRecharge: banglaEnabled ? '💰 সুপারিশকৃত রিচার্জ' : '💰 Recommended Recharge',
    optimalRechargeTiming: banglaEnabled ? '⏰ রিচার্জের সেরা সময়' : '⏰ Optimal Recharge Timing',
    anomalyDetected: banglaEnabled ? '⚠️ অস্বাভাবিকতা ধরা পড়েছে' : '⚠️ Anomaly Detected',
    seasonalPattern: banglaEnabled ? '🌡️ মৌসুমি ধারা' : '🌡️ Seasonal Pattern',
    rechargePattern: banglaEnabled ? '📊 রিচার্জের ধারা বিশ্লেষণ' : '📊 Recharge Pattern Analysis',
    actionableTip: banglaEnabled ? '💡 কার্যকরী পরামর্শ' : '💡 Actionable Tip',
  };
  return (
    <Section title={labels.aiInsights} defaultOpen>
      {isAiLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <Spinner size="w-6 h-6" color="border-slate-400" />
          <span>{labels.generating}</span>
        </div>
      ) : !aiSummary ? (
        <div className="text-slate-400">{labels.couldNotGenerate}</div>
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
          {/* 8. Balance Depletion Forecast */}
          {aiSummary.balanceDepletionForecast && (
            <div className="bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-400 mb-1">{labels.balanceDepletion}</h4>
                  <p className="text-sm text-red-300">{aiSummary.balanceDepletionForecast.details}</p>
                  {aiSummary.balanceDepletionForecast.daysRemaining !== null && (
                    <div className="mt-2 text-lg font-bold text-red-200">
                      {labels.estimatedDays} {aiSummary.balanceDepletionForecast.daysRemaining}
                    </div>
                  )}
                  {aiSummary.balanceDepletionForecast.expectedDepletionDate && (
                    <div className="text-sm text-red-200">
                      {labels.expectedDepletionDate} {aiSummary.balanceDepletionForecast.expectedDepletionDate}
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
                  <h4 className="font-semibold text-orange-400 mb-1">{labels.currentMonthBill}</h4>
                  <p className="text-sm text-orange-300">{aiSummary.currentMonthBillForecast.details}</p>
                  {aiSummary.currentMonthBillForecast.estimatedTotal !== null && (
                    <div className="mt-2 text-lg font-bold text-orange-200">
                      {labels.estimatedTotalBill} {formatCurrency(sanitizeCurrency(aiSummary.currentMonthBillForecast?.estimatedTotal))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* 10. Future Consumption Forecast */}
          {aiSummary.futureConsumptionForecast && aiSummary.futureConsumptionForecast.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-1">{labels.next3Months}</h4>
                  <table className="min-w-full text-sm text-cyan-200 mt-2">
                    <thead>
                      <tr>
                        <th className="pr-4 text-left">{labels.month}</th>
                        <th className="pr-4 text-left">{labels.estConsumption}</th>
                        <th className="pr-4 text-left">{labels.estBill}</th>
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
                  {labels.balanceStatus}: {aiSummary.balanceStatusAndAdvice?.status ? (banglaEnabled
                    ? aiSummary.balanceStatusAndAdvice.status === 'low' ? 'কম' : aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'মাঝারি' : 'ভালো'
                    : aiSummary.balanceStatusAndAdvice.status.charAt(0).toUpperCase() + aiSummary.balanceStatusAndAdvice.status.slice(1)) : (banglaEnabled ? 'অজানা' : 'Unknown')}
                </h4>
                <p className="text-sm text-slate-300">{aiSummary.balanceStatusAndAdvice?.details}</p>
              </div>
            </div>
          </div>
          {/* 2. Suggested Recharge Amount (now rechargeRecommendation) */}
          {aiSummary.rechargeRecommendation?.recommendedAmountBDT && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-1">{labels.recommendedRecharge}</h4>
                  <p className="text-2xl font-bold text-cyan-300 mb-2">{formatCurrency(sanitizeCurrency(aiSummary.rechargeRecommendation?.recommendedAmountBDT))}</p>
                  <p className="text-sm text-cyan-300">{aiSummary.rechargeRecommendation.justification}</p>
                </div>
              </div>
            </div>
          )}
          {/* 3. Recharge Timing Insight */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 border-l-4 border-l-indigo-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-indigo-400 mb-1">{labels.optimalRechargeTiming}</h4>
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
                  <h4 className="font-semibold text-amber-400 mb-1">{labels.anomalyDetected}</h4>
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
                  <h4 className="font-semibold text-blue-400 mb-1">{labels.seasonalPattern}</h4>
                  <p className="text-sm text-blue-300">{aiSummary.seasonalTrend.details}</p>
                </div>
              </div>
            </div>
          )}
          {/* 6. Recharge Pattern Insight */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="font-semibold text-slate-200 mb-2">{labels.rechargePattern}</h4>
            <p className="text-sm text-slate-300">{aiSummary.rechargePatternInsight}</p>
          </div>
          {/* 7. Actionable Tip */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-400 mb-1">{labels.actionableTip}</h4>
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