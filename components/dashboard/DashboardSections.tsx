// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { Account, AiSummary, RechargeHistoryItem } from '../../types';
import { useSectionPreferences } from '../common/Section';
import AIDashboardInsightsSection from './AIDashboardInsightsSection';
import AccountBalanceSection from './AccountBalanceSection';
import ConsumptionChartSection from './ConsumptionChartSection';
import ComparisonChartSection from './ComparisonChartSection';
import RechargeVsConsumptionSection from './RechargeVsConsumptionSection';
import RechargeDistributionSection from './RechargeDistributionSection';
import MaxDemandSection from './MaxDemandSection';
import CumulativeConsumptionSection from './CumulativeConsumptionSection';
import BoxPlotSection from './BoxPlotSection';
import MonthlyCostTrendSection from './MonthlyCostTrendSection';
import RechargeHistorySection from './RechargeHistorySection';
import ConsumerInformationSection from './ConsumerInformationSection';
import SectionInfoModal from '../common/SectionInfoModal';
import { getTranslationForLanguage } from '../../utils/i18n';
import i18n from '../../utils/i18n';
import BalanceDisplay from '../account/BalanceDisplay';
import { getAiBalanceEstimate } from '../../services/descoService';

const SECTION_CONFIGS = [
  { id: 'account-balance-status', defaultOpen: true },
  { id: 'consumption-chart', defaultOpen: true },
  { id: 'comparison-chart', defaultOpen: true },
  { id: 'recharge-vs-consumption', defaultOpen: true },
  { id: 'recharge-distribution', defaultOpen: true },
  { id: 'max-demand', defaultOpen: true },
  { id: 'cumulative-consumption', defaultOpen: true },
  { id: 'box-plot', defaultOpen: true },
  { id: 'monthly-cost-trend', defaultOpen: true },
  { id: 'recharge-history', defaultOpen: true },
  { id: 'consumer-information', defaultOpen: true },
];

const DashboardSections: React.FC<any> = ({
  processedData,
  data,
  isAiLoading,
  isAiAvailable,
  consumptionTimeRange,
  setConsumptionTimeRange,
  comparisonMetric,
  setComparisonMetric,
  rechargeYear,
  isHistoryLoading,
  handleYearChange,
  banglaEnabled,
  balanceUnavailable,
  account,
  showNotification,
  retryAiSummary,
}) => {
  const { getSectionPreference } = useSectionPreferences();
  const [preferencesVersion, setPreferencesVersion] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState<string | null>(null);

  // AI-powered balance estimation state
  const [aiEstimate, setAiEstimate] = useState<number | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiBalanceLoading, setIsAiBalanceLoading] = useState(false);
  const [aiBalanceError, setAiBalanceError] = useState<string | undefined>();
  const [estimatedDaysRemaining, setEstimatedDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Only run if all required data is available
    if (
      data?.monthlyConsumption &&
      data?.rechargeHistory &&
      data?.balance &&
      data?.dailyConsumption &&
      account?.aiInsightsEnabled
    ) {
      setIsAiBalanceLoading(true);
      const currentMonth = new Date().toISOString().substring(0, 7);
      // Get the last 14 days of dailyConsumption
      const recentDailyConsumption = data.dailyConsumption
        ? [...data.dailyConsumption].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
        : [];
      getAiBalanceEstimate(
        data.monthlyConsumption,
        data.rechargeHistory,
        data.balance,
        currentMonth,
        recentDailyConsumption,
        account.banglaEnabled
      ).then(res => {
        setAiEstimate(res.estimate);
        setAiInsight(res.insight);
        setAiBalanceError(res.error);
        setEstimatedDaysRemaining(res.estimatedDaysRemaining ?? null);
      }).finally(() => setIsAiBalanceLoading(false));
    }
  }, [data?.monthlyConsumption, data?.rechargeHistory, data?.balance, data?.dailyConsumption, account?.aiInsightsEnabled, account?.banglaEnabled]);

  // Compute language and translation function
  const language = banglaEnabled ? 'bn' : 'en';
  const t = getTranslationForLanguage(language);

  // Listen for changes in localStorage (from modal or other tabs)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('section-preference-')) {
        setPreferencesVersion(v => v + 1);
      }
    };
    window.addEventListener('storage', handleStorage);
    // Listen for custom event for same-tab updates
    const handleCustom = () => setPreferencesVersion(v => v + 1);
    window.addEventListener('section-preferences-updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('section-preferences-updated', handleCustom);
    };
  }, []);

  // Helper to get defaultOpen for a section
  const getDefaultOpen = useCallback((sectionId, fallback = true) => {
    const config = SECTION_CONFIGS.find(c => c.id === sectionId);
    return getSectionPreference(sectionId, config ? config.defaultOpen : fallback);
  }, [getSectionPreference]);

  // Section info data
  const getSectionInfo = useCallback((sectionId: string) => {
    const infoKey = `${sectionId}Info`;
    const translationData = i18n.getDataByLanguage(language)?.translation;
    const translationInfo = translationData?.[infoKey];
    return typeof translationInfo === 'object' ? translationInfo : {
      title: sectionId,
      description: 'Information about this section',
      benefits: ['Provides useful insights', 'Helps with analysis', 'Improves understanding']
    };
  }, [language]);

  // Handle info icon click
  const handleInfoClick = useCallback((sectionId: string) => {
    setInfoModalOpen(sectionId);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setInfoModalOpen(null);
  }, []);

  return (
    <div className="space-y-6" key={preferencesVersion}>
      {/* 1. AI Insights - Most valuable, actionable insights */}
      <AIDashboardInsightsSection
        aiSummary={data?.aiSummary}
        isAiLoading={isAiLoading}
        isAiAvailable={isAiAvailable}
        aiError={data?.aiError}
        banglaEnabled={banglaEnabled}
        t={t}
        balanceUnavailable={data?.balanceUnavailable || balanceUnavailable}
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('aiInsights')}
        onRetry={retryAiSummary}
      />
      {/* 2. Consumer Information - Essential account context (collapsible) */}
      <ConsumerInformationSection
        account={account}
        locationData={data?.location}
        banglaEnabled={banglaEnabled}
        t={t}
        showNotification={showNotification}
        defaultOpen={getDefaultOpen('consumer-information')}
        sectionId="consumer-information"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('consumerInfo')}
      />
      {/* 3. Account Balance - Current status */}
      <AccountBalanceSection
        gaugeData={processedData?.gaugeData}
        banglaEnabled={banglaEnabled}
        t={t}
        balanceUnavailable={balanceUnavailable}
        defaultOpen={getDefaultOpen('account-balance-status')}
        sectionId="account-balance-status"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('accountBalance')}
        // AI-powered note props
        aiInsight={aiInsight}
        aiError={aiBalanceError}
        isAiBalanceLoading={isAiBalanceLoading}
        estimatedDaysRemaining={estimatedDaysRemaining}
      />
      {/* 4. Consumption Chart - Primary usage visualization */}
      <ConsumptionChartSection
        consumptionChartData={processedData?.consumptionChartData}
        consumptionTimeRange={consumptionTimeRange}
        setConsumptionTimeRange={setConsumptionTimeRange}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('consumption-chart')}
        sectionId="consumption-chart"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('consumptionChart')}
      />
      {/* 5. Recharge History - Important transaction history */}
      <RechargeHistorySection
        rechargeHistory={data?.rechargeHistory}
        rechargeYear={rechargeYear}
        isHistoryLoading={isHistoryLoading}
        setRechargeYear={handleYearChange}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('recharge-history')}
        sectionId="recharge-history"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('rechargeHistory')}
      />
      {/* 6. Comparison Chart - Performance analysis */}
      <ComparisonChartSection
        comparisonData={processedData?.comparisonData}
        comparisonMetric={comparisonMetric}
        setComparisonMetric={setComparisonMetric}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('comparison-chart')}
        sectionId="comparison-chart"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('comparisonChart')}
      />
      {/* 7. Recharge vs Consumption - Usage patterns */}
      <RechargeVsConsumptionSection
        rechargeVsConsumptionData={processedData?.rechargeVsConsumptionData}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('recharge-vs-consumption')}
        sectionId="recharge-vs-consumption"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('rechargeVsConsumption')}
      />
      {/* 8. Recharge Distribution - Payment patterns */}
      <RechargeDistributionSection
        pieChartData={processedData?.pieChartData}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('recharge-distribution')}
        sectionId="recharge-distribution"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('rechargeDistribution')}
      />
      {/* 9. Max Demand - Peak usage insights */}
      <MaxDemandSection
        maxDemandData={processedData?.maxDemandData}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('max-demand')}
        sectionId="max-demand"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('maxDemand')}
      />
      {/* 10. Cumulative Consumption - Long-term trends */}
      <CumulativeConsumptionSection
        cumulativeData={processedData?.cumulativeData}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('cumulative-consumption')}
        sectionId="cumulative-consumption"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('cumulativeConsumption')}
      />
      {/* 11. Box Plot - Statistical analysis */}
      <BoxPlotSection
        boxPlotData={processedData?.boxPlotData}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('box-plot')}
        sectionId="box-plot"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('boxPlot')}
      />
      {/* 12. Monthly Cost Trend - Financial trends */}
      <MonthlyCostTrendSection
        monthlyCostData={processedData?.monthlyCostData}
        banglaEnabled={banglaEnabled}
        t={t}
        defaultOpen={getDefaultOpen('monthly-cost-trend')}
        sectionId="monthly-cost-trend"
        showInfoIcon={true}
        onInfoClick={() => handleInfoClick('monthlyCostTrend')}
      />
      
      {/* Section Info Modal */}
      {infoModalOpen && (
        <SectionInfoModal
          isOpen={!!infoModalOpen}
          onClose={handleModalClose}
          sectionInfo={getSectionInfo(infoModalOpen)}
          t={t}
        />
      )}
    </div>
  );
};

export default DashboardSections; 