// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

const ComparisonChartSection = ({ comparisonData, comparisonMetric, setComparisonMetric }) => {
  if (!comparisonData || comparisonData.length === 0) return null;
  return (
    <Section title="Year-over-Year Comparison" defaultOpen>
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg bg-slate-700/50 border border-slate-600">
          <button
            className={`px-4 py-2 font-semibold rounded-l-lg ${comparisonMetric === 'bdt' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            onClick={() => setComparisonMetric('bdt')}
          >
            BDT
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-r-lg ${comparisonMetric === 'kwh' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            onClick={() => setComparisonMetric('kwh')}
          >
            kWh
          </button>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Bar dataKey="Current Year" fill="#06b6d4" name="Current Year" />
            <Bar dataKey="Previous Year" fill="#f59e42" name="Previous Year" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default ComparisonChartSection; 