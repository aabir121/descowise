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

const DashboardSections: React.FC<any> = ({
  processedData,
  data,
  isAiLoading,
  isAiAvailable,
  consumptionTimeframe,
  setConsumptionTimeframe,
  comparisonMetric,
  setComparisonMetric,
  rechargeYear,
  isHistoryLoading,
  handleYearChange,
}) => (
  <div className="space-y-6">
    <AIDashboardInsightsSection
      aiSummary={data?.aiSummary}
      isAiLoading={isAiLoading}
      isAiAvailable={isAiAvailable}
      banglaEnabled={data?.account?.banglaEnabled ?? data?.banglaEnabled}
    />
    <AccountBalanceSection gaugeData={processedData?.gaugeData} />
    <ConsumptionChartSection
      consumptionChartData={processedData?.consumptionChartData}
      consumptionTimeframe={consumptionTimeframe}
      setConsumptionTimeframe={setConsumptionTimeframe}
    />
    <ComparisonChartSection
      comparisonData={processedData?.comparisonData}
      comparisonMetric={comparisonMetric}
      setComparisonMetric={setComparisonMetric}
    />
    <RechargeVsConsumptionSection rechargeVsConsumptionData={processedData?.rechargeVsConsumptionData} />
    <RechargeDistributionSection pieChartData={processedData?.pieChartData} />
    <MaxDemandSection maxDemandData={processedData?.maxDemandData} />
    <CumulativeConsumptionSection cumulativeData={processedData?.cumulativeData} />
    <BoxPlotSection boxPlotData={processedData?.boxPlotData} />
    <MonthlyCostTrendSection monthlyCostData={processedData?.monthlyCostData} />
    <RechargeHistorySection
      rechargeHistory={data?.rechargeHistory}
      rechargeYear={rechargeYear}
      isHistoryLoading={isHistoryLoading}
      setRechargeYear={handleYearChange}
    />
  </div>
);

export default DashboardSections; 