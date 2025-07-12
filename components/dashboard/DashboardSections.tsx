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
  consumptionTimeRange,
  setConsumptionTimeRange,
  comparisonMetric,
  setComparisonMetric,
  rechargeYear,
  isHistoryLoading,
  handleYearChange,
  banglaEnabled,
  balanceUnavailable,
}) => (
  <div className="space-y-6">
    <AIDashboardInsightsSection
      aiSummary={data?.aiSummary}
      isAiLoading={isAiLoading}
      isAiAvailable={isAiAvailable}
      banglaEnabled={banglaEnabled}
      balanceUnavailable={data?.balanceUnavailable || balanceUnavailable}
    />
    <AccountBalanceSection gaugeData={processedData?.gaugeData} banglaEnabled={banglaEnabled} balanceUnavailable={balanceUnavailable} />
    <ConsumptionChartSection
      consumptionChartData={processedData?.consumptionChartData}
      consumptionTimeRange={consumptionTimeRange}
      setConsumptionTimeRange={setConsumptionTimeRange}
      banglaEnabled={banglaEnabled}
    />
    <ComparisonChartSection
      comparisonData={processedData?.comparisonData}
      comparisonMetric={comparisonMetric}
      setComparisonMetric={setComparisonMetric}
      banglaEnabled={banglaEnabled}
    />
    <RechargeVsConsumptionSection rechargeVsConsumptionData={processedData?.rechargeVsConsumptionData} banglaEnabled={banglaEnabled} />
    <RechargeDistributionSection pieChartData={processedData?.pieChartData} banglaEnabled={banglaEnabled} />
    <MaxDemandSection maxDemandData={processedData?.maxDemandData} banglaEnabled={banglaEnabled} />
    <CumulativeConsumptionSection cumulativeData={processedData?.cumulativeData} banglaEnabled={banglaEnabled} />
    <BoxPlotSection boxPlotData={processedData?.boxPlotData} banglaEnabled={banglaEnabled} />
    <MonthlyCostTrendSection monthlyCostData={processedData?.monthlyCostData} banglaEnabled={banglaEnabled} />
    <RechargeHistorySection
      rechargeHistory={data?.rechargeHistory}
      rechargeYear={rechargeYear}
      isHistoryLoading={isHistoryLoading}
      setRechargeYear={handleYearChange}
      banglaEnabled={banglaEnabled}
    />
  </div>
);

export default DashboardSections; 