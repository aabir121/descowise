// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import { WandSparklesIcon } from '../common/Icons';
import { formatCurrency, sanitizeCurrency } from '../common/format';

const AIDashboardInsightsSection = ({ aiSummary, isAiLoading, isAiAvailable, banglaEnabled }) => {
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

  // Fun facts or tips (optional)
  const tips = [
    banglaEnabled
      ? "টিপ: নিচের ড্যাশবোর্ডে আপনার মাসিক প্রবণতা দেখতে পারেন।"
      : "Tip: You can view your monthly trends in the dashboard below.",
    banglaEnabled
      ? "জানেন কি? এআই আপনার বিদ্যুৎ ব্যবহার অপ্টিমাইজ করতে সাহায্য করতে পারে!"
      : "Did you know? AI can help you optimize your electricity usage!",
    banglaEnabled
      ? "টিপ: ব্যালেন্স কমে যাওয়ার আগেই রিচার্জ করুন।"
      : "Tip: Recharge before your balance runs low to avoid interruptions.",
  ];
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * tips.length));
  useEffect(() => {
    if (isAiLoading) {
      setTipIdx(Math.floor(Math.random() * tips.length));
    }
  }, [isAiLoading]);
  const randomTip = tips[tipIdx];

  if (!isAiAvailable) return null;
  // Define all section labels in both English and Bangla
  const labels = {
    aiInsights: banglaEnabled ? 'আপনার জন্য কিছু তথ্য' : 'AI-Powered Insights',
    generating: banglaEnabled ? 'আপনার জন্য তথ্য প্রস্তুত হচ্ছে...' : 'Generating your personalized summary...',
    couldNotGenerate: banglaEnabled ? 'দুঃখিত, বিশ্লেষণ দেখানো যাচ্ছে না।' : 'Could not generate AI summary.',
    balanceDepletion: banglaEnabled ? '⏳ ব্যালেন্স কখন শেষ হতে পারে' : '⏳ Balance Depletion Forecast',
    estimatedDays: banglaEnabled ? 'সম্ভাব্য বাকি দিন:' : 'Estimated Days Remaining:',
    expectedDepletionDate: banglaEnabled ? 'সম্ভাব্য শেষের তারিখ:' : 'Expected Depletion Date:',
    currentMonthBill: banglaEnabled ? '📅 এই মাসের সম্ভাব্য বিল' : '📅 Estimated Bill for This Month',
    estimatedTotalBill: banglaEnabled ? 'মোট অনুমানকৃত বিল:' : 'Estimated Total Bill:',
    next3Months: banglaEnabled ? '🔮 পরের ৩ মাসের পূর্বাভাস' : '🔮 Next 3 Months Forecast',
    month: banglaEnabled ? 'মাস' : 'Month',
    estConsumption: banglaEnabled ? 'সম্ভাব্য খরচ (কিলোওয়াট-ঘণ্টা)' : 'Est. Consumption (kWh)',
    estBill: banglaEnabled ? 'সম্ভাব্য বিল (৳)' : 'Est. Bill (৳)',
    balanceStatus: banglaEnabled ? 'ব্যালেন্সের অবস্থা' : 'Balance Status',
    recommendedRecharge: banglaEnabled ? '💰 রিচার্জের পরামর্শ' : '💰 Recommended Recharge',
    optimalRechargeTiming: banglaEnabled ? '⏰ কখন রিচার্জ করবেন' : '⏰ Optimal Recharge Timing',
    anomalyDetected: banglaEnabled ? '⚠️ কিছু অস্বাভাবিক লেগেছে' : '⚠️ Anomaly Detected',
    seasonalPattern: banglaEnabled ? '🌡️ মৌসুমি প্রবণতা' : '🌡️ Seasonal Pattern',
    rechargePattern: banglaEnabled ? '📊 রিচার্জের অভ্যাস' : '📊 Recharge Pattern Analysis',
    actionableTip: banglaEnabled ? '💡 সহজ টিপস' : '💡 Actionable Tip',
  };
  return (
    <Section title={labels.aiInsights} defaultOpen>
      {isAiLoading ? (
        <div className="flex flex-col items-start gap-3 text-slate-400">
          <div className="flex items-center gap-3">
            <Spinner size="w-6 h-6 animate-spin" color="border-slate-400" />
            <span>
              <strong>{banglaEnabled ? 'আপনার জন্য ব্যক্তিগত এআই বিশ্লেষণ তৈরি হচ্ছে…' : 'Generating your personalized AI analysis…'}</strong>
              <br />
              {banglaEnabled
                ? 'বিশ্লেষণটি জটিল হওয়ায় এটি সম্পন্ন হতে কিছুটা সময় লাগতে পারে।'
                : 'This may take a few moments due to the complexity of the analysis.'}
              <br />
              <span className="text-xs">{banglaEnabled ? 'সাধারণত ১০–২০ সেকেন্ড সময় লাগে।' : 'Usually takes 10–20 seconds.'}</span>
            </span>
          </div>
          <div className="mt-2 text-slate-500 italic">
            {waitedLong
              ? <>{banglaEnabled
                  ? <>এখনো কাজ চলছে… দেরির জন্য দুঃখিত! কখনো কখনো একটু বেশি সময় লাগতে পারে।<br /><button className="underline text-cyan-400 hover:text-cyan-300" onClick={() => window.location.reload()}>{'আবার চেষ্টা করুন'}</button></>
                  : <>Still working… Sorry for the delay! Sometimes this takes a bit longer.<br /><button className="underline text-cyan-400 hover:text-cyan-300" onClick={() => window.location.reload()}>Try Again</button></>
                }</>
              : randomTip}
          </div>
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