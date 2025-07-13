// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { getDashboardLabel } from './dashboardLabels';
import { useTranslation } from 'react-i18next';

const MaxDemandSection = ({ maxDemandData, banglaEnabled }) => {
  const { t, i18n } = useTranslation();
  if (!maxDemandData || maxDemandData.length === 0) return null;
  return (
    <Section title={getDashboardLabel('maxDemand', i18n.language === 'bn') + ' (kW)'} defaultOpen>
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