// @ts-nocheck
import React, { useEffect, useState, useCallback, Suspense, lazy, useMemo } from 'react';
import { Account, AiSummary, RechargeHistoryItem } from '../../types';
import { useSectionPreferences } from '../common/Section';
import { useDebounce, useDeepMemo } from '../../hooks/usePerformanceOptimization';
import AIDashboardInsightsSection from './AIDashboardInsightsSection';
import OverviewAiInsights from './AiInsights/OverviewAiInsights';
import AccountBalanceSection from './AccountBalanceSection';
import RechargeHistorySection from './RechargeHistorySection';
import ConsumerInformationSection from './ConsumerInformationSection';
import SectionInfoModal from '../common/SectionInfoModal';
import { SlideUpTransition } from '../common/SkeletonComponents';
import { getTranslationForLanguage } from '../../utils/i18n';
import i18n from '../../utils/i18n';
import BalanceDisplay from '../account/BalanceDisplay';

// Lazy load heavy chart components
const ConsumptionChartSection = lazy(() => import('./ConsumptionChartSection'));
const ComparisonChartSection = lazy(() => import('./ComparisonChartSection'));
const RechargeVsConsumptionSection = lazy(() => import('./RechargeVsConsumptionSection'));
const RechargeDistributionSection = lazy(() => import('./RechargeDistributionSection'));
const MaxDemandSection = lazy(() => import('./MaxDemandSection'));
const CumulativeConsumptionSection = lazy(() => import('./CumulativeConsumptionSection'));
const BoxPlotSection = lazy(() => import('./BoxPlotSection'));
const MonthlyCostTrendSection = lazy(() => import('./MonthlyCostTrendSection'));

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

// Loading component for chart sections
const ChartSectionLoader = () => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
    <div className="animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-slate-700 rounded"></div>
    </div>
  </div>
);

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
  // New distributed AI insights props
  distributedAiInsights,
  aiLoadingStates,
  isDataLoading = false,
}) => {
  const { getSectionPreference } = useSectionPreferences();
  const [preferencesVersion, setPreferencesVersion] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState<string | null>(null);

  // Extract AI-powered balance fields from aiSummary
  const aiSummary = data?.aiSummary;
  const aiInsight = aiSummary?.balanceInsight || '';
  const aiBalanceError = data?.aiError?.message || undefined;
  const isAiBalanceLoading = isAiLoading;
  const estimatedDaysRemaining = typeof aiSummary?.estimatedDaysRemaining === 'number' ? aiSummary.estimatedDaysRemaining : null;

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
      <SlideUpTransition show={!isDataLoading} delay="delay-75">
        <AIDashboardInsightsSection
          aiSummary={aiSummary}
          isAiLoading={isAiLoading}
          isAiAvailable={isAiAvailable}
          aiError={data?.aiError}
          banglaEnabled={banglaEnabled}
          t={t}
          balanceUnavailable={data?.balanceUnavailable || balanceUnavailable}
          showInfoIcon={true}
          onInfoClick={() => handleInfoClick('aiInsights')}
          onRetry={retryAiSummary}
          // New props for distributed insights
          distributedAiInsights={distributedAiInsights}
          aiLoadingStates={aiLoadingStates}
        />
      </SlideUpTransition>

      {/* 2. Consumer Information - Essential account context (collapsible) */}
      <SlideUpTransition show={!isDataLoading} delay="delay-100">
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
      </SlideUpTransition>
      {/* 3. Account Balance - Current status */}
      <SlideUpTransition show={!isDataLoading} delay="delay-150">
        <AccountBalanceSection
          gaugeData={processedData?.gaugeData}
          banglaEnabled={banglaEnabled}
          t={t}
          balanceUnavailable={balanceUnavailable}
          defaultOpen={getDefaultOpen('account-balance-status')}
          sectionId="account-balance-status"
          showInfoIcon={true}
          onInfoClick={() => handleInfoClick('accountBalance')}
          aiInsight={aiInsight}
          aiError={aiBalanceError}
          isAiBalanceLoading={isAiBalanceLoading}
          estimatedDaysRemaining={estimatedDaysRemaining}
          // New distributed AI insights
          balanceAiInsights={distributedAiInsights?.balance}
          isAiLoading={aiLoadingStates?.balance}
          isDataLoading={!processedData}
        />
      </SlideUpTransition>

      {/* 4. Consumption Chart - Primary usage visualization */}
      <SlideUpTransition show={!isDataLoading} delay="delay-200">
        <Suspense fallback={<ChartSectionLoader />}>
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
            // New distributed AI insights
            consumptionAiInsights={distributedAiInsights?.consumption}
            isAiLoading={aiLoadingStates?.consumption}
            isDataLoading={!processedData}
          />
        </Suspense>
      </SlideUpTransition>
      {/* 5. Recharge History - Important transaction history */}
      <SlideUpTransition show={!isDataLoading} delay="delay-300">
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
          // New distributed AI insights
          rechargeAiInsights={distributedAiInsights?.recharge}
          isAiLoading={aiLoadingStates?.recharge}
        />
      </SlideUpTransition>

      {/* 6. Comparison Chart - Performance analysis */}
      <SlideUpTransition show={!isDataLoading} delay="delay-500">
        <Suspense fallback={<ChartSectionLoader />}>
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
        </Suspense>
      </SlideUpTransition>
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