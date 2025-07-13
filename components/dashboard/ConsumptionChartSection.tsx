// @ts-nocheck
import React, { useState } from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { getDashboardLabel } from './dashboardLabels';

type TimeRange = '7days' | 'thisMonth' | '30days' | '6months' | '1year' | '2years';
type ChartView = 'energy' | 'cost';

const ConsumptionChartSection = ({ consumptionChartData, consumptionTimeRange, setConsumptionTimeRange, banglaEnabled, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  const [chartView, setChartView] = useState<ChartView>('cost');
  // Default to 7days if not set
  React.useEffect(() => {
    if (!consumptionTimeRange) {
      setConsumptionTimeRange('7days');
    }
  }, [consumptionTimeRange, setConsumptionTimeRange]);
  
  if (!consumptionChartData || consumptionChartData.length === 0) return null;

  // Calculate total based on chart view and data
  const totalValue = consumptionChartData.reduce((sum, item) => {
    return sum + (chartView === 'energy' ? (item.kWh || 0) : (item.BDT || 0));
  }, 0);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '7days', label: getDashboardLabel('last7Days', banglaEnabled) },
    { value: 'thisMonth', label: getDashboardLabel('thisMonth', banglaEnabled) },
    { value: '30days', label: getDashboardLabel('last30Days', banglaEnabled) },
    { value: '6months', label: getDashboardLabel('last6Months', banglaEnabled) },
    { value: '1year', label: getDashboardLabel('last1Year', banglaEnabled) },
    { value: '2years', label: getDashboardLabel('last2Years', banglaEnabled) },
  ];

  const chartViewOptions: { value: ChartView; label: string }[] = [
    { value: 'cost', label: getDashboardLabel('costComparison', banglaEnabled) },
    { value: 'energy', label: getDashboardLabel('energyConsumption', banglaEnabled) },
  ];

  // Create summary value for header
  const summaryValue = (
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
  );

  return (
    <Section 
      title={getDashboardLabel('consumptionChart', banglaEnabled)} 
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
      summaryValue={summaryValue}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        {/* Chart View Toggle */}
        <div className="inline-flex rounded-lg bg-slate-700/50 border border-slate-600 overflow-hidden w-full sm:w-auto">
          {chartViewOptions.map((option, index) => (
            <button
              key={option.value}
              className={`px-4 py-2 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:z-10
                ${chartView === option.value 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-600'}
                ${index === 0 ? 'rounded-l-lg' : ''}
                ${index === chartViewOptions.length - 1 ? 'rounded-r-lg' : ''}
                ${index > 0 && index < chartViewOptions.length - 1 ? 'border-l border-slate-600' : ''}
              `}
              onClick={() => setChartView(option.value)}
              style={{ minWidth: 90 }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Time Range Toggle - wrap on mobile, more margin */}
        <div className="my-3 sm:my-0">
          <div className="flex flex-wrap gap-2 rounded-lg bg-slate-700/50 border border-slate-600 p-1">
            {timeRangeOptions.map((option, index) => (
              <button
                key={option.value}
                className={`px-3 py-2 text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:z-10
                  ${consumptionTimeRange === option.value 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-600'}
                  ${index === 0 ? 'rounded-l-lg' : ''}
                  ${index === timeRangeOptions.length - 1 ? 'rounded-r-lg' : ''}
                `}
                onClick={() => setConsumptionTimeRange(option.value)}
                style={{ minWidth: 90 }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="w-full h-60 sm:h-80 px-1 sm:px-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={consumptionChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} stroke="#4b5563" fontSize={12} />
            {chartView === 'energy' ? (
              <>
                <YAxis tick={{ fill: '#fb923c', fontSize: 12 }} stroke="#f97316" label={{ value: t('kWh'), angle: -90, position: 'insideLeft', fill: '#fb923c', dx: -10, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px', fontSize: 12 }} />
                <Line type="monotone" dataKey="kWh" stroke="#fb923c" strokeWidth={2} dot={{ fill: '#fb923c', strokeWidth: 2, r: 4 }} name={t('kWh')} />
              </>
            ) : (
              <>
                <YAxis tick={{ fill: '#22d3ee', fontSize: 12 }} stroke="#06b6d4" label={{ value: t('BDT'), angle: -90, position: 'insideLeft', fill: '#22d3ee', dx: -10, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px', fontSize: 12 }} />
                <Line type="monotone" dataKey="BDT" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', strokeWidth: 2, r: 4 }} name={t('BDT')} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default ConsumptionChartSection; 