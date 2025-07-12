// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

const RechargeVsConsumptionSection = ({ rechargeVsConsumptionData }) => {
  if (!rechargeVsConsumptionData || rechargeVsConsumptionData.length === 0) return null;
  return (
    <Section title="Recharge vs. Consumption" defaultOpen sectionId="recharge-vs-consumption">
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <BarChart data={rechargeVsConsumptionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Bar dataKey="Consumption" fill="#f97316" name="Consumption (BDT)" />
            <Bar dataKey="Recharge" fill="#22d3ee" name="Recharge (BDT)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default RechargeVsConsumptionSection; 