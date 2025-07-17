// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Section from '../common/Section';
import { formatCurrency, sanitizeCurrency } from '../common/format';
import AIInsightsLoading from './AIDashboardInsights/AIInsightsLoading';
import AIInsightsError from './AIDashboardInsights/AIInsightsError';
import BalanceUnavailableNotice from './AIDashboardInsights/BalanceUnavailableNotice';
import AIInsightsHeader from './AIDashboardInsights/AIInsightsHeader';
import BalanceDepletionForecast from './AIDashboardInsights/BalanceDepletionForecast';
import CurrentMonthBillForecast from './AIDashboardInsights/CurrentMonthBillForecast';
import FutureConsumptionForecast from './AIDashboardInsights/FutureConsumptionForecast';
import BalanceStatusAndAdvice from './AIDashboardInsights/BalanceStatusAndAdvice';
import RechargeRecommendation from './AIDashboardInsights/RechargeRecommendation';
import RechargeTimingInsight from './AIDashboardInsights/RechargeTimingInsight';
import AnomalyAlert from './AIDashboardInsights/AnomalyAlert';
import SeasonalTrend from './AIDashboardInsights/SeasonalTrend';
import RechargePatternInsight from './AIDashboardInsights/RechargePatternInsight';
import ActionableTip from './AIDashboardInsights/ActionableTip';

const AIDashboardInsightsSection = ({ aiSummary, isAiLoading, isAiAvailable, aiError, banglaEnabled, balanceUnavailable, t, showInfoIcon, onInfoClick, onRetry }) => {
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

  if (!isAiAvailable && !aiError) return null;
  return (
    <Section 
      title={t('aiInsights')} 
      defaultOpen={true} 
      sectionId="ai-powered-insights" 
      alwaysExpanded={true}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      {isAiLoading ? (
        <AIInsightsLoading waitedLong={waitedLong} randomTip={randomTip} t={t} onRetry={onRetry} />
      ) : aiError ? (
        <AIInsightsError aiError={aiError} t={t} onRetry={onRetry} />
      ) : !aiSummary ? (
        <div className="text-slate-400">{t('couldNotGenerate')}</div>
      ) : (
        <div className="sm:space-y-6">
          <div className="overflow-y-auto max-h-[60vh] sm:max-h-none pr-2 sm:pr-0">
            {balanceUnavailable && <BalanceUnavailableNotice t={t} />}
            <div className="space-y-6">
              <AIInsightsHeader aiSummary={aiSummary} t={t} />
              {!balanceUnavailable && aiSummary.balanceDepletionForecast && (
                <BalanceDepletionForecast
                  details={aiSummary.balanceDepletionForecast.details}
                  daysRemaining={aiSummary.balanceDepletionForecast.daysRemaining}
                  expectedDepletionDate={aiSummary.balanceDepletionForecast.expectedDepletionDate}
                  t={t}
                />
              )}
              {aiSummary.currentMonthBillForecast && (
                <CurrentMonthBillForecast
                  details={aiSummary.currentMonthBillForecast.details}
                  estimatedTotal={aiSummary.currentMonthBillForecast.estimatedTotal}
                  t={t}
                  formatCurrency={formatCurrency}
                  sanitizeCurrency={sanitizeCurrency}
                />
              )}
              {aiSummary.futureConsumptionForecast && (
                <FutureConsumptionForecast
                  forecast={aiSummary.futureConsumptionForecast}
                  t={t}
                  formatCurrency={formatCurrency}
                  sanitizeCurrency={sanitizeCurrency}
                />
              )}
              {aiSummary.balanceStatusAndAdvice && (
                <BalanceStatusAndAdvice
                  status={aiSummary.balanceStatusAndAdvice.status}
                  details={aiSummary.balanceStatusAndAdvice.details}
                  t={t}
                />
              )}
              {aiSummary.rechargeRecommendation && (
                <RechargeRecommendation
                  justification={aiSummary.rechargeRecommendation.justification}
                  recommendedAmountBDT={aiSummary.rechargeRecommendation.recommendedAmountBDT}
                  t={t}
                  formatCurrency={formatCurrency}
                  sanitizeCurrency={sanitizeCurrency}
                />
              )}
              {aiSummary.rechargeTimingInsight && (
                <RechargeTimingInsight
                  insight={aiSummary.rechargeTimingInsight}
                  t={t}
                />
              )}
              {aiSummary.anomaly && (
                <AnomalyAlert
                  details={aiSummary.anomaly.details}
                  t={t}
                />
              )}
              {aiSummary.seasonalTrend && aiSummary.seasonalTrend.observed && (
                <SeasonalTrend
                  details={aiSummary.seasonalTrend.details}
                  t={t}
                />
              )}
              {aiSummary.rechargePatternInsight && (
                <RechargePatternInsight
                  insight={aiSummary.rechargePatternInsight}
                  t={t}
                />
              )}
              {aiSummary.actionableTip && (
                <div className="bg-purple-500/10 border border-purple-500/20 border-l-4 border-l-purple-400 rounded-lg p-4">
                  <ActionableTip
                    tip={aiSummary.actionableTip}
                    t={t}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
};

export default AIDashboardInsightsSection; 