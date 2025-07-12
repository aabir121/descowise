// @ts-nocheck
import React from 'react';
import { Account, AiSummary, RechargeHistoryItem } from '../../types';
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
}) => (
  <div className="space-y-6">
    {/* 1. AI Insights - Most valuable, actionable insights */}
    <AIDashboardInsightsSection
      aiSummary={data?.aiSummary}
      isAiLoading={isAiLoading}
      isAiAvailable={isAiAvailable}
      banglaEnabled={banglaEnabled}
      balanceUnavailable={data?.balanceUnavailable || balanceUnavailable}
    />
    
    {/* 2. Consumer Information - Essential account context (collapsible) */}
    <ConsumerInformationSection
      account={account}
      locationData={data?.location}
      banglaEnabled={banglaEnabled}
      showNotification={showNotification}
    />
    
    {/* 3. Account Balance - Current status */}
    <AccountBalanceSection gaugeData={processedData?.gaugeData} banglaEnabled={banglaEnabled} balanceUnavailable={balanceUnavailable} />
    
    {/* 4. Consumption Chart - Primary usage visualization */}
    <ConsumptionChartSection
      consumptionChartData={processedData?.consumptionChartData}
      consumptionTimeRange={consumptionTimeRange}
      setConsumptionTimeRange={setConsumptionTimeRange}
      banglaEnabled={banglaEnabled}
    />
    
    {/* 5. Recharge History - Important transaction history */}
    <RechargeHistorySection
      rechargeHistory={data?.rechargeHistory}
      rechargeYear={rechargeYear}
      isHistoryLoading={isHistoryLoading}
      setRechargeYear={handleYearChange}
      banglaEnabled={banglaEnabled}
    />
    
    {/* 6. Comparison Chart - Performance analysis */}
    <ComparisonChartSection
      comparisonData={processedData?.comparisonData}
      comparisonMetric={comparisonMetric}
      setComparisonMetric={setComparisonMetric}
      banglaEnabled={banglaEnabled}
    />
    
    {/* 7. Recharge vs Consumption - Usage patterns */}
    <RechargeVsConsumptionSection rechargeVsConsumptionData={processedData?.rechargeVsConsumptionData} banglaEnabled={banglaEnabled} />
    
    {/* 8. Recharge Distribution - Payment patterns */}
    <RechargeDistributionSection pieChartData={processedData?.pieChartData} banglaEnabled={banglaEnabled} />
    
    {/* 9. Max Demand - Peak usage insights */}
    <MaxDemandSection maxDemandData={processedData?.maxDemandData} banglaEnabled={banglaEnabled} />
    
    {/* 10. Cumulative Consumption - Long-term trends */}
    <CumulativeConsumptionSection cumulativeData={processedData?.cumulativeData} banglaEnabled={banglaEnabled} />
    
    {/* 11. Box Plot - Statistical analysis */}
    <BoxPlotSection boxPlotData={processedData?.boxPlotData} banglaEnabled={banglaEnabled} />
    
    {/* 12. Monthly Cost Trend - Financial trends */}
    <MonthlyCostTrendSection monthlyCostData={processedData?.monthlyCostData} banglaEnabled={banglaEnabled} />
  </div>
);

export default DashboardSections; 