// @ts-nocheck
import React, { useMemo } from 'react';
import Section from '../common/Section';
import { ClockIcon, BatteryIcon, CalendarIcon, TrendingDownIcon } from '../common/Icons';
import { formatCurrency } from '../common/format';

interface BalanceRunwayProps {
  gaugeData: {
    currentBalance: number;
    averageMonthlyCost: number;
    daysRemaining: number;
    percentage: number;
  } | null;
  banglaEnabled: boolean;
  t: (key: string) => string;
  defaultOpen: boolean;
  sectionId: string;
  showInfoIcon: boolean;
  onInfoClick: () => void;
}

const BalanceRunway: React.FC<BalanceRunwayProps> = ({
  gaugeData,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick
}) => {
  // Calculate runway insights
  const runwayInsights = useMemo(() => {
    if (!gaugeData) return null;

    const { currentBalance, averageMonthlyCost, daysRemaining } = gaugeData;
    
    // Calculate daily average cost
    const dailyAverageCost = averageMonthlyCost / 30;
    
    // Determine runway status
    let status = 'good';
    let statusColor = 'text-green-400';
    let statusBgColor = 'bg-green-500/10';
    let statusBorderColor = 'border-green-500/20';
    let progressColor = 'from-green-500 to-green-400';
    
    if (daysRemaining <= 7) {
      status = 'critical';
      statusColor = 'text-red-400';
      statusBgColor = 'bg-red-500/10';
      statusBorderColor = 'border-red-500/20';
      progressColor = 'from-red-500 to-red-400';
    } else if (daysRemaining <= 15) {
      status = 'warning';
      statusColor = 'text-yellow-400';
      statusBgColor = 'bg-yellow-500/10';
      statusBorderColor = 'border-yellow-500/20';
      progressColor = 'from-yellow-500 to-yellow-400';
    }
    
    // Calculate progress percentage (inverse - more days = fuller bar)
    const maxDays = 60; // Consider 60 days as "full"
    const progressPercentage = Math.min((daysRemaining / maxDays) * 100, 100);
    
    // Calculate when balance will run out
    const runOutDate = new Date();
    runOutDate.setDate(runOutDate.getDate() + daysRemaining);
    
    return {
      currentBalance,
      daysRemaining,
      dailyAverageCost,
      status,
      statusColor,
      statusBgColor,
      statusBorderColor,
      progressColor,
      progressPercentage,
      runOutDate,
      monthsRemaining: Math.floor(daysRemaining / 30),
      weeksRemaining: Math.floor(daysRemaining / 7)
    };
  }, [gaugeData]);

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
