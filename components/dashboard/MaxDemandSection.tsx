// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { getDashboardLabel } from './dashboardLabels';

const MaxDemandSection = ({ maxDemandData, banglaEnabled, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  if (!maxDemandData || maxDemandData.length === 0) return null;
  return (
    <Section 
      title={getDashboardLabel('maxDemand', banglaEnabled) + ' (kW)'} 
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={maxDemandData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
            <Line type="monotone" dataKey="Max Demand (kW)" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name={t('maxDemandKW')} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default MaxDemandSection; 