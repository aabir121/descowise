// @ts-nocheck
import React, { useMemo } from 'react';
import Section from '../common/Section';
import { ClockIcon, BatteryIcon, CalendarIcon, TrendingDownIcon } from '../common/Icons';
import { formatCurrency } from '../common/format';
import { BalanceCalculator } from '../../utils/balanceCalculations';
import { MonthlyConsumption, DailyConsumption } from '../../types';

interface BalanceRunwayProps {
  gaugeData: {
    currentBalance: number;
    averageMonthlyCost: number;
    daysRemaining: number;
    percentage: number;
  } | null;
  // AI prediction data
  aiSummary?: {
    estimatedDaysRemaining?: number;
    balanceDepletionForecast?: string;
    balanceStatusAndAdvice?: string;
  } | null;
  // Historical consumption data for statistical analysis
  consumptionChartData?: Array<{
    name: string;
    kWh: number;
    BDT: number;
    date?: string;
  }> | null;
  // Raw data for consistent calculations
  dailyConsumption?: DailyConsumption[] | null;
  monthlyConsumption?: MonthlyConsumption[] | null;
  banglaEnabled: boolean;
  t: (key: string) => string;
  defaultOpen: boolean;
  sectionId: string;
  showInfoIcon: boolean;
  onInfoClick: () => void;
}

const BalanceRunway: React.FC<BalanceRunwayProps> = ({
  gaugeData,
  aiSummary,
  consumptionChartData,
  dailyConsumption,
  monthlyConsumption,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick
}) => {
  // Calculate runway insights with unified calculation system
  const runwayInsights = useMemo(() => {
    if (!gaugeData) return null;

    const { currentBalance, averageMonthlyCost, daysRemaining } = gaugeData;

    // Priority 1: Use AI prediction if available
    let finalDaysRemaining = daysRemaining;
    let dataSource = 'basic';
    let confidence = 0.7;
    let additionalInfo = '';

    if (aiSummary?.estimatedDaysRemaining && typeof aiSummary.estimatedDaysRemaining === 'number') {
      // Use AI prediction
      finalDaysRemaining = aiSummary.estimatedDaysRemaining;
      dataSource = 'ai';
      confidence = 0.9;
      additionalInfo = String(aiSummary.balanceDepletionForecast || ''); // Ensure it's a string
    } else {
      // Fallback to gaugeData's daysRemaining (which comes from BalanceCalculator in useDashboardData)
      finalDaysRemaining = daysRemaining;
      dataSource = gaugeData.calculationMethod || 'basic'; // Use method from gaugeData if available
      confidence = gaugeData.confidence || 0.7;
      additionalInfo = String(gaugeData.details || ''); // Ensure it's a string
    }

    // Calculate daily average cost using gaugeData's averageMonthlyCost
    const dailyAverageCost = averageMonthlyCost / 30;

    // Determine runway status
    let status = 'good';
    let statusColor = 'text-green-400';
    let statusBgColor = 'bg-green-500/10';
    let statusBorderColor = 'border-green-500/20';
    let progressColor = 'from-green-500 to-green-400';

    if (finalDaysRemaining <= 7) {
      status = 'critical';
      statusColor = 'text-red-400';
      statusBgColor = 'bg-red-500/10';
      statusBorderColor = 'border-red-500/20';
      progressColor = 'from-red-500 to-red-400';
    } else if (finalDaysRemaining <= 15) {
      status = 'warning';
      statusColor = 'text-yellow-400';
      statusBgColor = 'bg-yellow-500/10';
      statusBorderColor = 'border-yellow-500/20';
      progressColor = 'from-yellow-500 to-yellow-400';
    }

    // Calculate progress percentage (inverse - more days = fuller bar)
    const maxDays = 60; // Consider 60 days as "full"
    const progressPercentage = Math.min((finalDaysRemaining / maxDays) * 100, 100);

    // Calculate when balance will run out
    const runOutDate = new Date();
    runOutDate.setDate(runOutDate.getDate() + finalDaysRemaining);

    return {
      currentBalance,
      daysRemaining: finalDaysRemaining,
      dailyAverageCost,
      status,
      statusColor,
      statusBgColor,
      statusBorderColor,
      progressColor,
      progressPercentage,
      runOutDate,
      monthsRemaining: Math.floor(finalDaysRemaining / 30),
      weeksRemaining: Math.floor(finalDaysRemaining / 7),
      dataSource,
      confidence,
      additionalInfo
    };
  }, [gaugeData, aiSummary]);

  if (!gaugeData || !runwayInsights) return null;

  return (
    <Section
      title={t('balanceRunway')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="space-y-6">
        {/* Main Runway Display */}
        <div className={`${runwayInsights.statusBgColor} ${runwayInsights.statusBorderColor} border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-700/50 ${runwayInsights.statusColor}`}>
                <BatteryIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {t('balanceWillLast')} {runwayInsights.daysRemaining} {t('days')}
                </h3>
                <p className="text-sm text-slate-400">
                  {t('currentBalance')}: {formatCurrency(runwayInsights.currentBalance, banglaEnabled)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${runwayInsights.statusColor}`}>
                {runwayInsights.daysRemaining}
              </div>
              <div className="text-xs text-slate-400">{t('daysLeft')}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>{t('timeRemaining')}</span>
              <span>
                {runwayInsights.monthsRemaining > 0 && `${runwayInsights.monthsRemaining}${t('monthsShort')} `}
                {runwayInsights.weeksRemaining % 4}${t('weeksShort')}
              </span>
            </div>
            
            <div className="relative h-4 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full bg-gradient-to-r ${runwayInsights.progressColor} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${runwayInsights.progressPercentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-sm">
                  {Math.round(runwayInsights.progressPercentage)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Estimated Run Out Date */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {t('estimatedRunOut')}: {runwayInsights.runOutDate.toLocaleDateString('default', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDownIcon className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-slate-200">{t('dailyUsage')}</h4>
            </div>
            <p className="text-lg font-semibold text-slate-100">
              {formatCurrency(runwayInsights.dailyAverageCost, banglaEnabled)}
            </p>
            <p className="text-xs text-slate-400">{t('averagePerDay')}</p>
          </div>
          
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-medium text-slate-200">{t('timeLeft')}</h4>
            </div>
            <p className="text-lg font-semibold text-slate-100">
              {runwayInsights.weeksRemaining} {t('weeks')}
            </p>
            <p className="text-xs text-slate-400">{t('approximately')}</p>
          </div>
          
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                runwayInsights.status === 'critical' ? 'bg-red-400' :
                runwayInsights.status === 'warning' ? 'bg-yellow-400' :
                'bg-green-400'
              }`}></div>
              <h4 className="text-sm font-medium text-slate-200">{t('status')}</h4>
            </div>
            <p className={`text-lg font-semibold ${runwayInsights.statusColor}`}>
              {t(runwayInsights.status)}
            </p>
            <p className="text-xs text-slate-400">
              {runwayInsights.status === 'critical' ? t('rechargeUrgently') :
               runwayInsights.status === 'warning' ? t('rechargeSoon') :
               t('balanceHealthy')}
            </p>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-slate-300">{t('dataSource')}</h5>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                runwayInsights.dataSource === 'ai' ? 'bg-purple-400' :
                runwayInsights.dataSource === 'statistical' ? 'bg-blue-400' :
                'bg-gray-400'
              }`}></div>
              <span className="text-xs text-slate-400">
                {runwayInsights.dataSource === 'ai' ? t('aiPrediction') :
                 runwayInsights.dataSource === 'statistical' ? t('statisticalAnalysis') :
                 t('basicCalculation')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('confidence')}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    runwayInsights.confidence >= 0.8 ? 'bg-green-400' :
                    runwayInsights.confidence >= 0.6 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${runwayInsights.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-300">
                {Math.round(runwayInsights.confidence * 100)}%
              </span>
            </div>
          </div>

          {runwayInsights.additionalInfo && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {runwayInsights.additionalInfo}
            </p>
          )}
        </div>

        {/* Recommendation */}
        {runwayInsights.status !== 'good' && (
          <div className={`${runwayInsights.statusBgColor} ${runwayInsights.statusBorderColor} border rounded-lg p-4`}>
            <h4 className={`font-medium text-sm ${runwayInsights.statusColor} mb-2`}>
              💡 {t('recommendation')}
            </h4>
            <p className="text-sm text-slate-300">
              {runwayInsights.status === 'critical'
                ? t('criticalBalanceRecommendation')
                : t('lowBalanceRecommendation')
              }
            </p>
          </div>
        )}
      </div>
    </Section>
  );
};

export default BalanceRunway;
