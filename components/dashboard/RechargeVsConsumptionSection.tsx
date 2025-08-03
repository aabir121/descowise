// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getMobileChartConfig, getChartContainerStyles, getMobileAxisConfig } from '../../utils/mobileChartConfig';

const RechargeVsConsumptionSection = ({ rechargeVsConsumptionData, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  if (!rechargeVsConsumptionData || rechargeVsConsumptionData.length === 0) return null;

  const mobileConfig = getMobileChartConfig('bar');
  const axisConfig = getMobileAxisConfig();

  return (
    <Section
      title={t('rechargeVsConsumption')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div
        className="w-full px-2 sm:px-0"
        style={{ height: mobileConfig.height }}
      >
        <ResponsiveContainer>
          <BarChart data={rechargeVsConsumptionData} margin={mobileConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="month"
              tick={axisConfig.xAxis.tick}
              stroke={axisConfig.xAxis.stroke}
              fontSize={axisConfig.xAxis.fontSize}
              height={axisConfig.xAxis.height}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: mobileConfig.fontSize }}
              stroke="#4b5563"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={mobileConfig.legendStyle} />
            <Bar dataKey="Consumption" fill="#f97316" name={t('consumptionBDT')} />
            <Bar dataKey="Recharge" fill="#22d3ee" name={t('rechargeBDT')} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
};

export default RechargeVsConsumptionSection; 