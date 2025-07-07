// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';

const CumulativeConsumptionSection = ({ cumulativeData }) => {
  if (!cumulativeData || cumulativeData.length === 0) return null;
  return (
    <Section title="Cumulative Consumption Trend" defaultOpen>
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <AreaChart data={cumulativeData} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis yAxisId="left" tick={{ fill: '#fb923c' }} stroke="#f97316" label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#fb923c', dx: -10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22d3ee' }} stroke="#06b6d4" label={{ value: 'BDT', angle: -90, position: 'insideRight', fill: '#22d3ee', dx: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Area yAxisId="left" type="monotone" dataKey="cumulativeKWh" stroke="#fb923c" fill="#fb923c" fillOpacity={0.3} />
            <Area yAxisId="right" type="monotone" dataKey="cumulativeBDT" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default CumulativeConsumptionSection; 