// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#06b6d4', '#f59e42', '#fb7185', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#818cf8', '#f87171', '#4ade80', '#facc15', '#60a5fa'
];

const RechargeDistributionSection = ({ pieChartData }) => {
  if (!pieChartData || pieChartData.length === 0) return null;
  return (
    <Section title="Recharge Distribution by Operator" defaultOpen>
      <div className="h-80 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default RechargeDistributionSection; 