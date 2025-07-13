// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

const MonthlyCostTrendSection = ({ monthlyCostData, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  if (!monthlyCostData || monthlyCostData.length === 0) return null;
  return (
    <Section 
      title={t('monthlyCostTrend')} 
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={monthlyCostData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Line type="monotone" dataKey="Monthly Cost (BDT)" stroke="#f97316" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default MonthlyCostTrendSection; 