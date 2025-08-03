// @ts-nocheck
import React, { useState, memo, useMemo } from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceDot } from 'recharts';
import { getDashboardLabel } from './dashboardLabels';
import { optimizeChartData, debounceChartUpdate } from '../../utils/chartOptimization';
import ConsumptionAiInsights from './AiInsights/ConsumptionAiInsights';
import { SkeletonChart } from '../common/SkeletonComponents';
import { detectSignificantChanges, getAnnotationExplanation, processDataWithAnnotations } from '../../utils/chartAnnotations';

type TimeRange = 'thisMonth' | '6months' | '1year';
type ChartView = 'energy' | 'cost';

const ConsumptionChartSection = memo(({
  consumptionChartData,
  consumptionTimeRange,
  setConsumptionTimeRange,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick,
  // New props for distributed AI insights
  consumptionAiInsights,
  isAiLoading,
  isDataLoading = false
}) => {
  const [chartView, setChartView] = useState<ChartView>('cost');

  // Mobile-first responsive configuration
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const mobileChartConfig = useMemo(() => ({
    height: isMobile ? 280 : 320, // Increased mobile height
    margin: {
      top: 10,
      right: isMobile ? 10 : 20,
      left: isMobile ? 5 : -10, // Positive margin for mobile
      bottom: isMobile ? 25 : 5 // More bottom space for mobile legends
    },
    fontSize: isMobile ? 14 : 12, // Larger font for mobile
    dotRadius: isMobile ? 6 : 4, // Larger touch targets
    strokeWidth: isMobile ? 3 : 2, // Thicker lines for mobile
    legendStyle: {
      color: '#e5e7eb',
      paddingTop: isMobile ? '25px' : '20px',
      fontSize: isMobile ? 14 : 12
    }
  }), [isMobile]);

  // Default to thisMonth if not set
  React.useEffect(() => {
    if (!consumptionTimeRange) {
      setConsumptionTimeRange('thisMonth');
    }
  }, [consumptionTimeRange, setConsumptionTimeRange]);

  // Memoize expensive calculations with chart optimization and annotations
  const { totalValue, chartData, annotations } = useMemo(() => {
    if (!consumptionChartData || consumptionChartData.length === 0) {
      return { totalValue: 0, chartData: [], annotations: [] };
    }

    const total = consumptionChartData.reduce((sum, item) => {
      return sum + (chartView === 'energy' ? (item.kWh || 0) : (item.BDT || 0));
    }, 0);

    // Process data with annotations for significant changes
    const dataKey = chartView === 'energy' ? 'kWh' : 'BDT';
    const { data: enhancedData, annotations: detectedAnnotations } = processDataWithAnnotations(
      consumptionChartData,
      dataKey,
      {
        minChangePercent: 20, // 20% change threshold for electricity usage
        detectPeaks: true,
        detectAnomalies: true
      }
    );

    // Optimize chart data to reduce DOM complexity
    const optimizedData = optimizeChartData(enhancedData, 'line', {
      maxPoints: 50,
      keyField: 'name',
      preserveExtremes: true
    });

    return {
      totalValue: total,
      chartData: optimizedData,
      annotations: detectedAnnotations
    };
  }, [consumptionChartData, chartView]);

  // Simplified time range options for better mobile UX (3 essential options)
  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'thisMonth', label: getDashboardLabel('thisMonth', banglaEnabled) },
    { value: '6months', label: getDashboardLabel('last6Months', banglaEnabled) },
    { value: '1year', label: getDashboardLabel('last1Year', banglaEnabled) }
  ];

  // Create summary value for header (memoized, must be before early return)
  const summaryValueComponent = useMemo(() => (
    <div className="text-right">
      <div className={`text-lg sm:text-xl font-bold ${chartView === 'energy' ? 'text-orange-400' : 'text-cyan-400'}`}>
        {totalValue.toLocaleString('en-US', {
          minimumFractionDigits: chartView === 'energy' ? 2 : 0,
          maximumFractionDigits: chartView === 'energy' ? 2 : 0
        })} {chartView === 'energy' ? 'kWh' : 'BDT'}
      </div>
      <div className="text-xs text-slate-400">{t('total')}</div>
    </div>
  ), [totalValue, chartView, t]);

  // Show skeleton when data is loading
  if (isDataLoading || !consumptionChartData) {
    return (
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 bg-slate-700 rounded w-32 animate-pulse" />
            {showInfoIcon && (
              <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {/* Chart controls skeleton */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-8 bg-slate-700 rounded w-20 animate-pulse"
              />
            ))}
          </div>

          {/* Chart area skeleton */}
          <div className="animate-pulse">
            <div className="bg-slate-700 rounded h-64 w-full" />
          </div>

          {/* Chart legend skeleton */}
          <div className="flex justify-center gap-4 mt-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 bg-slate-700 rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chartViewOptions: { value: ChartView; label: string }[] = [
    { value: 'cost', label: getDashboardLabel('costComparison', banglaEnabled) },
    { value: 'energy', label: getDashboardLabel('energyConsumption', banglaEnabled) },
  ];

  if (!chartData || chartData.length === 0) return null;

  return (
    <Section
      title={getDashboardLabel('consumptionChart', banglaEnabled)}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
      summaryValue={
        <div className="text-right">
          <div className={`text-lg sm:text-xl font-bold ${chartView === 'energy' ? 'text-orange-400' : 'text-cyan-400'}`}>
            {totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: chartView === 'energy' ? 1 : 0
            })}
            <span className="text-slate-400 text-xs sm:text-sm font-medium ml-1">
              {chartView === 'energy' ? t('kWh') : t('BDT')}
            </span>
          </div>
        </div>
      }
      isAiLoading={isAiLoading}
      aiLoadingText={t('analyzingUsage')}
    >
      {/* AI Insights - First content item */}
      {consumptionAiInsights && (
        <ConsumptionAiInsights insights={consumptionAiInsights} t={t} />
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        {/* Chart View Toggle - Mobile optimized */}
        <div className="inline-flex rounded-lg bg-slate-700/50 border border-slate-600 overflow-hidden w-full sm:w-auto">
          {chartViewOptions.map((option, index) => (
            <button
              key={option.value}
              className={`flex-1 sm:flex-none px-6 py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:z-10
                ${chartView === option.value
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-600'}
                ${index === 0 ? 'rounded-l-lg' : ''}
                ${index === chartViewOptions.length - 1 ? 'rounded-r-lg' : ''}
                ${index > 0 && index < chartViewOptions.length - 1 ? 'border-l border-slate-600' : ''}
              `}
              onClick={() => setChartView(option.value)}
              style={{
                minHeight: '44px',
                minWidth: isMobile ? 'auto' : '120px'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Simplified Time Range Toggle - mobile-optimized */}
        <div className="my-3 sm:my-0">
          <div className="flex gap-1 rounded-lg bg-slate-700/50 border border-slate-600 p-1">
            {timeRangeOptions.map((option, index) => (
              <button
                key={option.value}
                className={`flex-1 px-4 py-3 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:z-10 rounded-md
                  ${consumptionTimeRange === option.value
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-600'}
                `}
                onClick={() => setConsumptionTimeRange(option.value)}
                style={{
                  minHeight: '44px', // Minimum touch target size
                  minWidth: isMobile ? 'auto' : '100px' // Flexible width on mobile
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="w-full px-2 sm:px-0"
        style={{ height: mobileChartConfig.height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={mobileChartConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9ca3af', fontSize: mobileChartConfig.fontSize }}
              stroke="#4b5563"
              fontSize={mobileChartConfig.fontSize}
              height={isMobile ? 50 : 30} // More space for mobile labels
            />
            {chartView === 'energy' ? (
              <>
                <YAxis
                  tick={{ fill: '#fb923c', fontSize: mobileChartConfig.fontSize }}
                  stroke="#f97316"
                  label={{
                    value: t('kWh'),
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#fb923c',
                    dx: isMobile ? 0 : -10, // Better positioning for mobile
                    fontSize: mobileChartConfig.fontSize
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={mobileChartConfig.legendStyle} />
                <Line
                  type="monotone"
                  dataKey="kWh"
                  stroke="#fb923c"
                  strokeWidth={mobileChartConfig.strokeWidth}
                  dot={{
                    fill: '#fb923c',
                    strokeWidth: mobileChartConfig.strokeWidth,
                    r: mobileChartConfig.dotRadius
                  }}
                  name={t('kWh')}
                />

                {/* Add annotations for significant changes */}
                {annotations.map((annotation, index) => (
                  <ReferenceDot
                    key={`annotation-kwh-${index}`}
                    x={annotation.dataKey}
                    y={annotation.value}
                    r={8}
                    fill={annotation.color}
                    stroke="white"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                ))}
              </>
            ) : (
              <>
                <YAxis
                  tick={{ fill: '#22d3ee', fontSize: mobileChartConfig.fontSize }}
                  stroke="#06b6d4"
                  label={{
                    value: t('BDT'),
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#22d3ee',
                    dx: isMobile ? 0 : -10, // Better positioning for mobile
                    fontSize: mobileChartConfig.fontSize
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={mobileChartConfig.legendStyle} />
                <Line
                  type="monotone"
                  dataKey="BDT"
                  stroke="#22d3ee"
                  strokeWidth={mobileChartConfig.strokeWidth}
                  dot={{
                    fill: '#22d3ee',
                    strokeWidth: mobileChartConfig.strokeWidth,
                    r: mobileChartConfig.dotRadius
                  }}
                  name={t('BDT')}
                />

                {/* Add annotations for significant changes */}
                {annotations.map((annotation, index) => (
                  <ReferenceDot
                    key={`annotation-bdt-${index}`}
                    x={annotation.dataKey}
                    y={annotation.value}
                    r={8}
                    fill={annotation.color}
                    stroke="white"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                ))}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Annotation Legend */}
      {annotations.length > 0 && (
        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
          <h5 className="text-sm font-medium text-slate-300 mb-2">{t('significantChanges')}</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {annotations.map((annotation, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: annotation.color }}
                />
                <span className="text-slate-300">
                  {annotation.dataKey}: {getAnnotationExplanation(annotation, t)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
});

export default ConsumptionChartSection;