// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Section from '../common/Section';
import AIInsightsLoading from './AIDashboardInsights/AIInsightsLoading';
import AIInsightsError from './AIDashboardInsights/AIInsightsError';
import BalanceUnavailableNotice from './AIDashboardInsights/BalanceUnavailableNotice';
import MainAiInsights from './AiInsights/MainAiInsights';
import AiFeatureDisabledNotice from './AiFeatureDisabledNotice';

const AIDashboardInsightsSection = ({
  aiSummary,
  isAiLoading,
  isAiAvailable,
  aiError,
  banglaEnabled,
  balanceUnavailable,
  t,
  showInfoIcon,
  onInfoClick,
  onRetry,
  onSetupApiKey,
  // New props for distributed insights
  distributedAiInsights,
  aiLoadingStates
}) => {
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

  // Show disabled notice if AI is not available and there's no error or loading
  if (!isAiAvailable && !aiError && !isAiLoading) {
    return (
      <Section
        title={t('aiInsights')}
        defaultOpen={false}
        sectionId="ai-powered-insights"
        showInfoIcon={showInfoIcon}
        onInfoClick={onInfoClick}
      >
        <AiFeatureDisabledNotice onSetupApiKey={onSetupApiKey} />
      </Section>
    );
  }
  return (
    <Section
      title={t('aiInsights')}
      defaultOpen={false} // Make it collapsible by default
      sectionId="ai-powered-insights"
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
      isAiLoading={aiLoadingStates?.main || isAiLoading}
      aiLoadingText={t('generatingInsights')}
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

            {/* Show ONLY main AI insights - high-level summary and critical alerts */}
            {distributedAiInsights?.main && (
              <MainAiInsights insights={distributedAiInsights.main} t={t} />
            )}

            {/* Fallback: If no distributed insights available, show message */}
            {!distributedAiInsights?.main && aiSummary && (
              <div className="text-center text-slate-400 py-8">
                <p>{t('aiInsightsDistributedToPanels')}</p>
                <p className="text-sm mt-2">{t('checkIndividualSections')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
};

export default AIDashboardInsightsSection; 