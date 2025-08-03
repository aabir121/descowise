// @ts-nocheck
import React, { useMemo } from 'react';
import Section from '../common/Section';
import CustomTooltip from '../common/CustomTooltip';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell } from 'recharts';
import { getMobileChartConfig, getMobileAxisConfig } from '../../utils/mobileChartConfig';
import { TrendingUpIcon, TrendingDownIcon, BalanceIcon } from '../common/Icons';

interface NetBalanceData {
  month: string;
  Consumption: number;
  Recharge: number;
}

interface NetBalanceSectionProps {
  rechargeVsConsumptionData: NetBalanceData[];
  banglaEnabled: boolean;
  t: (key: string) => string;
  defaultOpen: boolean;
  sectionId: string;
  showInfoIcon: boolean;
  onInfoClick: () => void;
}

const NetBalanceSection: React.FC<NetBalanceSectionProps> = ({
  rechargeVsConsumptionData,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick
}) => {
  // Process data to calculate net balance
  const { netBalanceData, summary } = useMemo(() => {
    if (!rechargeVsConsumptionData || rechargeVsConsumptionData.length === 0) {
      return { netBalanceData: [], summary: null };
    }

    const processedData = rechargeVsConsumptionData.map(item => {
      const netBalance = item.Recharge - item.Consumption;
      return {
        month: item.month,
        netBalance,
        recharge: item.Recharge,
        consumption: item.Consumption,
        isPositive: netBalance >= 0
      };
    });

    // Calculate summary statistics
    const totalRecharge = rechargeVsConsumptionData.reduce((sum, item) => sum + item.Recharge, 0);
    const totalConsumption = rechargeVsConsumptionData.reduce((sum, item) => sum + item.Consumption, 0);
    const overallNetBalance = totalRecharge - totalConsumption;
    const positiveMonths = processedData.filter(item => item.isPositive).length;
    const negativeMonths = processedData.filter(item => !item.isPositive).length;

    // Find best and worst months
    const bestMonth = processedData.reduce((best, current) => 
      current.netBalance > best.netBalance ? current : best
    );
    const worstMonth = processedData.reduce((worst, current) => 
      current.netBalance < worst.netBalance ? current : worst
    );

    return {
      netBalanceData: processedData,
      summary: {
        totalRecharge,
        totalConsumption,
        overallNetBalance,
        positiveMonths,
        negativeMonths,
        bestMonth,
        worstMonth,
        averageNetBalance: overallNetBalance / processedData.length
      }
    };
  }, [rechargeVsConsumptionData]);

  if (!rechargeVsConsumptionData || rechargeVsConsumptionData.length === 0) return null;

  const mobileConfig = getMobileChartConfig('bar');
  const axisConfig = getMobileAxisConfig();

  // Custom tooltip for net balance
  const NetBalanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-200 font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-cyan-400">
              {t('recharge')}: {data.recharge.toLocaleString()} {t('BDT')}
            </p>
            <p className="text-orange-400">
              {t('consumption')}: {data.consumption.toLocaleString()} {t('BDT')}
            </p>
            <hr className="border-slate-600 my-2" />
            <p className={`font-semibold ${data.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {t('netBalance')}: {data.isPositive ? '+' : ''}{data.netBalance.toLocaleString()} {t('BDT')}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Section
      title={t('netBalanceAnalysis')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
      summaryValue={
        summary && (
          <div className="text-right">
            <div className={`text-lg sm:text-xl font-bold ${
              summary.overallNetBalance >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {summary.overallNetBalance >= 0 ? '+' : ''}{summary.overallNetBalance.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">{t('totalNet')} {t('BDT')}</div>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-lg p-4 ${
              summary.overallNetBalance >= 0 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BalanceIcon className={`w-5 h-5 ${
                  summary.overallNetBalance >= 0 ? 'text-green-400' : 'text-red-400'
                }`} />
                <h4 className="text-sm font-medium text-slate-200">{t('overallBalance')}</h4>
              </div>
              <p className={`text-xl font-bold ${
                summary.overallNetBalance >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {summary.overallNetBalance >= 0 ? '+' : ''}{summary.overallNetBalance.toLocaleString()} {t('BDT')}
              </p>
              <p className="text-xs text-slate-400">
                {summary.overallNetBalance >= 0 ? t('surplus') : t('deficit')}
              </p>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUpIcon className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-medium text-slate-200">{t('positiveMonths')}</h4>
              </div>
              <p className="text-xl font-bold text-green-400">
                {summary.positiveMonths}
              </p>
              <p className="text-xs text-slate-400">
                {t('outOf')} {summary.positiveMonths + summary.negativeMonths} {t('months')}
              </p>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDownIcon className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-medium text-slate-200">{t('negativeMonths')}</h4>
              </div>
              <p className="text-xl font-bold text-red-400">
                {summary.negativeMonths}
              </p>
              <p className="text-xs text-slate-400">
                {t('needMoreRecharge')}
              </p>
            </div>
          </div>
        )}

        {/* Net Balance Chart */}
        <div
          className="w-full px-2 sm:px-0"
          style={{ height: mobileConfig.height }}
        >
          <ResponsiveContainer>
            <BarChart data={netBalanceData} margin={mobileConfig.margin}>
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
                label={{
                  value: t('netBalanceBDT'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9ca3af',
                  fontSize: mobileConfig.fontSize
                }}
              />
              <Tooltip content={<NetBalanceTooltip />} />
              <Bar dataKey="netBalance" name={t('netBalance')}>
                {netBalanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isPositive ? '#22c55e' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best/Worst Month Insights */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h5 className="text-green-400 font-medium mb-2">🏆 {t('bestMonth')}</h5>
              <p className="text-slate-200 font-semibold">{summary.bestMonth.month}</p>
              <p className="text-green-400 text-lg font-bold">
                +{summary.bestMonth.netBalance.toLocaleString()} {t('BDT')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('rechargedMore')} {(summary.bestMonth.netBalance).toLocaleString()} {t('BDT')}
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h5 className="text-red-400 font-medium mb-2">⚠️ {t('worstMonth')}</h5>
              <p className="text-slate-200 font-semibold">{summary.worstMonth.month}</p>
              <p className="text-red-400 text-lg font-bold">
                {summary.worstMonth.netBalance.toLocaleString()} {t('BDT')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('spentMore')} {Math.abs(summary.worstMonth.netBalance).toLocaleString()} {t('BDT')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

export default NetBalanceSection;
