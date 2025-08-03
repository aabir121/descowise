// @ts-nocheck
import React, { memo } from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import OptimizedChart from '../common/OptimizedChart';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getDashboardLabel } from './dashboardLabels';

const ComparisonChartSection = memo(({ comparisonData, comparisonMetric, setComparisonMetric, banglaEnabled, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  if (!comparisonData || comparisonData.length === 0) return null;
  return (
    <Section 
      title={getDashboardLabel('comparison', banglaEnabled)} 
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg bg-slate-700/50 border border-slate-600">
          <button
            className={`px-6 py-3 font-semibold rounded-l-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${comparisonMetric === 'bdt' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            onClick={() => setComparisonMetric('bdt')}
            style={{ minHeight: '44px', minWidth: '80px' }}
          >
            {t('BDT')}
          </button>
          <button
            className={`px-6 py-3 font-semibold rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${comparisonMetric === 'kwh' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            onClick={() => setComparisonMetric('kwh')}
            style={{ minHeight: '44px', minWidth: '80px' }}
          >
            {t('kWh')}
          </button>
        </div>
      </div>
      <OptimizedChart
        data={comparisonData || []}
        chartType="bar"
        height="320px"
        maxDataPoints={24}
        enableDataSampling={true}
        enableLazyLoading={true}
        className="w-full"
      >
        {(optimizedData) => (
          <BarChart data={optimizedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Bar dataKey="Current Year" fill="#06b6d4" name={t('currentYear')} />
            <Bar dataKey="Previous Year" fill="#f59e42" name={t('previousYear')} />
          </BarChart>
        )}
      </OptimizedChart>
    </Section>
  );
});

ComparisonChartSection.displayName = 'ComparisonChartSection';

export default ComparisonChartSection;