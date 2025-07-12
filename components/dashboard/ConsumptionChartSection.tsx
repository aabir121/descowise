// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { getDashboardLabel } from './dashboardLabels';

const ConsumptionChartSection = ({ consumptionChartData, consumptionTimeframe, setConsumptionTimeframe, banglaEnabled }) => {
  if (!consumptionChartData || consumptionChartData.length === 0) return null;
  return (
    <Section title={getDashboardLabel('consumptionChart', banglaEnabled)} defaultOpen>
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg bg-slate-700/50 border border-slate-600">
          <button
            className={`px-4 py-2 font-semibold rounded-l-lg ${consumptionTimeframe === 'daily' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            onClick={() => setConsumptionTimeframe('daily')}
          >
            {banglaEnabled ? 'দৈনিক' : 'Daily'}
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-r-lg ${consumptionTimeframe === 'monthly' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            onClick={() => setConsumptionTimeframe('monthly')}
          >
            {banglaEnabled ? 'মাসিক' : 'Monthly'}
          </button>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={consumptionChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis yAxisId="left" tick={{ fill: '#fb923c' }} stroke="#f97316" label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#fb923c', dx: -10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22d3ee' }} stroke="#06b6d4" label={{ value: 'BDT', angle: -90, position: 'insideRight', fill: '#22d3ee', dx: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Line yAxisId="left" type="monotone" dataKey="kWh" stroke="#fb923c" strokeWidth={2} dot={{ fill: '#fb923c', strokeWidth: 2, r: 4 }} name="kWh" />
            <Line yAxisId="right" type="monotone" dataKey="BDT" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', strokeWidth: 2, r: 4 }} name="BDT" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default ConsumptionChartSection; 