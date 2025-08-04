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
import DashboardTabs from './DashboardTabs';
import StandardizedLoading, { LoadingTransition, StaggeredLoadingContainer } from '../common/StandardizedLoading';
import { calculateLoadingDelay, useDebouncedLoading } from '../../utils/loadingStates';

// Lazy load heavy chart components
const ConsumptionChartSection = lazy(() => import('./ConsumptionChartSection'));
const ComparisonChartSection = lazy(() => import('./ComparisonChartSection'));
const NetBalanceSection = lazy(() => import('./NetBalanceSection'));
const RechargeDistributionSection = lazy(() => import('./RechargeDistributionSection'));
const PeakUsageAlert = lazy(() => import('./PeakUsageAlert'));
const BalanceRunway = lazy(() => import('./BalanceRunway'));
const SimpleTrendCard = lazy(() => import('./SimpleTrendCard'));
const MonthlyCostTrendSection = lazy(() => import('./MonthlyCostTrendSection'));

// Dashboard section priority system
const SECTION_PRIORITIES = {
  ESSENTIAL: 'essential',
  ANALYSIS: 'analysis',
  HISTORY: 'history'
};

const SECTION_CONFIGS = [
  // Essential sections - shown by default (Priority 1)
  { id: 'account-balance-status', defaultOpen: true, priority: SECTION_PRIORITIES.ESSENTIAL, order: 1 },
  { id: 'ai-insights', defaultOpen: true, priority: SECTION_PRIORITIES.ESSENTIAL, order: 2 },
  { id: 'consumption-chart', defaultOpen: true, priority: SECTION_PRIORITIES.ESSENTIAL, order: 3 },
  { id: 'recharge-history', defaultOpen: true, priority: SECTION_PRIORITIES.ESSENTIAL, order: 4 },

  // Analysis sections - progressive disclosure (Priority 2)
  { id: 'comparison-chart', defaultOpen: false, priority: SECTION_PRIORITIES.ANALYSIS, order: 5 },
  { id: 'recharge-vs-consumption', defaultOpen: false, priority: SECTION_PRIORITIES.ANALYSIS, order: 6 },
  { id: 'consumer-information', defaultOpen: false, priority: SECTION_PRIORITIES.ANALYSIS, order: 7 },

  // History/Advanced sections - hidden by default (Priority 3)
  { id: 'recharge-distribution', defaultOpen: false, priority: SECTION_PRIORITIES.HISTORY, order: 8 },
  { id: 'max-demand', defaultOpen: false, priority: SECTION_PRIORITIES.HISTORY, order: 9 },
  { id: 'cumulative-consumption', defaultOpen: false, priority: SECTION_PRIORITIES.HISTORY, order: 10 },
  { id: 'box-plot', defaultOpen: false, priority: SECTION_PRIORITIES.HISTORY, order: 11 },
  { id: 'monthly-cost-trend', defaultOpen: false, priority: SECTION_PRIORITIES.HISTORY, order: 12 },
];

// Dashboard view modes
const DASHBOARD_VIEWS = {
  ESSENTIAL: 'essential',
  ANALYSIS: 'analysis',
  HISTORY: 'history',
  ALL: 'all'
};

// Standardized loading component factory
const createSectionLoader = (sectionId: string, showControls: boolean = false, t: (key: string) => string) => (
  <StandardizedLoading
    type="skeleton"
    sectionId={sectionId}
    showControls={showControls}
    t={t}
    height="h-64"
  />
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
  onSetupApiKey,
}) => {
  const { getSectionPreference } = useSectionPreferences();
  const [preferencesVersion, setPreferencesVersion] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState<string | null>(null);

  // Dashboard view mode state - default to essential view
  const [dashboardView, setDashboardView] = useState(DASHBOARD_VIEWS.ESSENTIAL);

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

  // Helper to determine if a section should be visible based on current view
  const shouldShowSection = useCallback((sectionId: string) => {
    const config = SECTION_CONFIGS.find(c => c.id === sectionId);
    if (!config) return true; // Show unknown sections by default

    switch (dashboardView) {
      case DASHBOARD_VIEWS.ESSENTIAL:
        return config.priority === SECTION_PRIORITIES.ESSENTIAL;
      case DASHBOARD_VIEWS.ANALYSIS:
        // Analysis view shows ONLY analysis sections, not essential ones
        return config.priority === SECTION_PRIORITIES.ANALYSIS;
      case DASHBOARD_VIEWS.HISTORY:
        return config.priority === SECTION_PRIORITIES.HISTORY;
      case DASHBOARD_VIEWS.ALL:
        return true;
      default:
        return config.priority === SECTION_PRIORITIES.ESSENTIAL;
    }
  }, [dashboardView]);

  // Get sections for current view, sorted by order
  const visibleSections = useMemo(() => {
    return SECTION_CONFIGS
      .filter(config => shouldShowSection(config.id))
      .sort((a, b) => a.order - b.order);
  }, [shouldShowSection]);

  // Section info data
    const getSectionInfo = useCallback((sectionId: string, t: (key: string) => string) => {
    const infoKey = `${sectionId}Info`;
    const translationData = i18n.getDataByLanguage(language)?.translation;
    const translationInfo = translationData?.[infoKey];

    // Use translated title if available, otherwise fallback to a default
    const title = t(`${infoKey}.title`, sectionId);

    return typeof translationInfo === 'object' ? {
      ...translationInfo,
      title: t(`${infoKey}.title`, title), // Ensure title is translated
      description: t(`${infoKey}.description`, 'Information about this section'),
      benefits: Array.isArray(translationInfo.benefits) 
        ? translationInfo.benefits.map((benefit: string, index: number) => 
            t(`${infoKey}.benefits.${index}`, benefit)
          ) 
        : [t('info.defaultBenefit1'), t('info.defaultBenefit2'), t('info.defaultBenefit3')]
    } : {
      title,
      description: t('info.defaultDescription'),
      benefits: [t('info.defaultBenefit1'), t('info.defaultBenefit2'), t('info.defaultBenefit3')]
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

  // Render section based on ID and priority
  const renderSection = useCallback((sectionId: string, index: number) => {
    const delayClass = `delay-${Math.min(500, (index + 1) * 75)}`;

    switch (sectionId) {
      case 'ai-insights':
        return account.aiInsightsEnabled && shouldShowSection('ai-insights') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
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
              onSetupApiKey={onSetupApiKey}
              distributedAiInsights={distributedAiInsights}
              aiLoadingStates={aiLoadingStates}
            />
          </SlideUpTransition>
        ) : null;

      case 'account-balance-status':
        return shouldShowSection('account-balance-status') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <AccountBalanceSection
              gaugeData={processedData?.gaugeData}
              banglaEnabled={banglaEnabled}
              t={t}
              balanceUnavailable={balanceUnavailable}
              defaultOpen={getDefaultOpen('account-balance-status')}
              sectionId="account-balance-status"
              showInfoIcon={true}
              onInfoClick={() => handleInfoClick('accountBalance')}
              aiInsight={account.aiInsightsEnabled ? aiInsight : null}
              aiError={account.aiInsightsEnabled ? aiBalanceError : null}
              isAiBalanceLoading={account.aiInsightsEnabled ? isAiBalanceLoading : false}
              estimatedDaysRemaining={account.aiInsightsEnabled ? estimatedDaysRemaining : null}
              balanceAiInsights={account.aiInsightsEnabled ? distributedAiInsights?.balance : null}
              isAiLoading={account.aiInsightsEnabled ? aiLoadingStates?.balance : false}
              isDataLoading={!processedData}
            />
          </SlideUpTransition>
        ) : null;

      case 'consumption-chart':
        return shouldShowSection('consumption-chart') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <Suspense fallback={createSectionLoader('consumption-chart', true, t)}>
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
                consumptionAiInsights={account.aiInsightsEnabled ? distributedAiInsights?.consumption : null}
                isAiLoading={account.aiInsightsEnabled ? aiLoadingStates?.consumption : false}
                isDataLoading={!processedData}
              />
            </Suspense>
          </SlideUpTransition>
        ) : null;

      case 'recharge-history':
        return shouldShowSection('recharge-history') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
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
              rechargeAiInsights={account.aiInsightsEnabled ? distributedAiInsights?.recharge : null}
              isAiLoading={account.aiInsightsEnabled ? aiLoadingStates?.recharge : false}
            />
          </SlideUpTransition>
        ) : null;

      // Analysis priority sections
      case 'comparison-chart':
        return shouldShowSection('comparison-chart') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <Suspense fallback={createSectionLoader('comparison-chart', true, t)}>
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
        ) : null;

      case 'recharge-vs-consumption':
        return shouldShowSection('recharge-vs-consumption') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <Suspense fallback={createSectionLoader('recharge-vs-consumption', false, t)}>
              <NetBalanceSection
                rechargeVsConsumptionData={processedData?.rechargeVsConsumptionData}
                banglaEnabled={banglaEnabled}
                t={t}
                defaultOpen={getDefaultOpen('recharge-vs-consumption')}
                sectionId="recharge-vs-consumption"
                showInfoIcon={true}
                onInfoClick={() => handleInfoClick('rechargeVsConsumption')}
              />
            </Suspense>
          </SlideUpTransition>
        ) : null;

      case 'consumer-information':
        return shouldShowSection('consumer-information') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
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
        ) : null;

      // History priority sections
      case 'recharge-distribution':
        return shouldShowSection('recharge-distribution') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <RechargeDistributionSection
              pieChartData={processedData?.pieChartData}
              banglaEnabled={banglaEnabled}
              t={t}
              defaultOpen={getDefaultOpen('recharge-distribution')}
              sectionId="recharge-distribution"
              showInfoIcon={true}
              onInfoClick={() => handleInfoClick('rechargeDistribution')}
            />
          </SlideUpTransition>
        ) : null;

      case 'max-demand':
        return shouldShowSection('max-demand') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <Suspense fallback={createSectionLoader('max-demand', false, t)}>
              <PeakUsageAlert
                maxDemandData={processedData?.maxDemandData}
                banglaEnabled={banglaEnabled}
                t={t}
                defaultOpen={getDefaultOpen('max-demand')}
                sectionId="max-demand"
                showInfoIcon={true}
                onInfoClick={() => handleInfoClick('maxDemand')}
              />
            </Suspense>
          </SlideUpTransition>
        ) : null;

      case 'cumulative-consumption':
        return shouldShowSection('cumulative-consumption') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <Suspense fallback={createSectionLoader('cumulative-consumption', false, t)}>
              <BalanceRunway
                gaugeData={processedData?.gaugeData}
                aiSummary={data?.aiSummary}
                consumptionChartData={processedData?.consumptionChartData}
                dailyConsumption={data?.dailyConsumption}
                monthlyConsumption={data?.monthlyConsumption}
                banglaEnabled={banglaEnabled}
                t={t}
                defaultOpen={getDefaultOpen('cumulative-consumption')}
                sectionId="cumulative-consumption"
                showInfoIcon={true}
                onInfoClick={() => handleInfoClick('cumulativeConsumption')}
              />
            </Suspense>
          </SlideUpTransition>
        ) : null;

      case 'box-plot':
        return shouldShowSection('box-plot') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <Suspense fallback={createSectionLoader('box-plot', false, t)}>
              <SimpleTrendCard
                boxPlotData={processedData?.boxPlotData}
                banglaEnabled={banglaEnabled}
                t={t}
                defaultOpen={getDefaultOpen('box-plot')}
                sectionId="box-plot"
                showInfoIcon={true}
                onInfoClick={() => handleInfoClick('boxPlot')}
              />
            </Suspense>
          </SlideUpTransition>
        ) : null;

      case 'monthly-cost-trend':
        return shouldShowSection('monthly-cost-trend') ? (
          <SlideUpTransition key={sectionId} show={!isDataLoading} delay={delayClass}>
            <MonthlyCostTrendSection
              monthlyCostData={processedData?.monthlyCostData}
              banglaEnabled={banglaEnabled}
              t={t}
              defaultOpen={getDefaultOpen('monthly-cost-trend')}
              sectionId="monthly-cost-trend"
              showInfoIcon={true}
              onInfoClick={() => handleInfoClick('monthlyCostTrend')}
            />
          </SlideUpTransition>
        ) : null;

      default:
        return null;
    }
  }, [shouldShowSection, account.aiInsightsEnabled, isDataLoading, aiSummary, isAiLoading, isAiAvailable, data, banglaEnabled, t, balanceUnavailable, getDefaultOpen, handleInfoClick, retryAiSummary, onSetupApiKey, distributedAiInsights, aiLoadingStates, processedData, consumptionTimeRange, setConsumptionTimeRange, rechargeYear, isHistoryLoading, handleYearChange, aiInsight, aiBalanceError, isAiBalanceLoading, estimatedDaysRemaining]);

  return (
    <div className="space-y-6" key={preferencesVersion}>
      {/* Dashboard View Tabs */}
      <DashboardTabs
        activeView={dashboardView}
        onViewChange={setDashboardView}
        t={t}
        className="top-0 z-20"
      />

      {/* Render sections with staggered loading */}
      <StaggeredLoadingContainer staggerDelay={100}>
        {visibleSections.map((config, index) => renderSection(config.id, index))}
      </StaggeredLoadingContainer>


      
      {/* Section Info Modal */}
            {infoModalOpen && (
        <SectionInfoModal
          isOpen={!!infoModalOpen}
          onClose={handleModalClose}
          sectionInfo={getSectionInfo(infoModalOpen, t)}
          t={t}
        />
      )}
    </div>
  );
};

export default DashboardSections; 