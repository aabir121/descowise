// @ts-nocheck
import React, { useMemo } from 'react';
import Section from '../common/Section';
import { BoltIcon, TrendingUpIcon, ExclamationTriangleIcon, CalendarIcon } from '../common/Icons';

interface PeakUsageAlertProps {
  maxDemandData: Array<{
    month: string;
    'Max Demand (kW)': number;
  }> | null;
  banglaEnabled: boolean;
  t: (key: string) => string;
  defaultOpen: boolean;
  sectionId: string;
  showInfoIcon: boolean;
  onInfoClick: () => void;
}

const PeakUsageAlert: React.FC<PeakUsageAlertProps> = ({
  maxDemandData,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick
}) => {
  // Calculate peak usage insights
  const peakInsights = useMemo(() => {
    if (!maxDemandData || maxDemandData.length === 0) return null;

    // Find the highest demand and its month
    const peakEntry = maxDemandData.reduce((max, current) => 
      (current['Max Demand (kW)'] > max['Max Demand (kW)']) ? current : max
    );
    
    // Calculate average demand
    const validDemands = maxDemandData.filter(d => d['Max Demand (kW)'] > 0);
    const averageDemand = validDemands.length > 0 
      ? validDemands.reduce((sum, d) => sum + d['Max Demand (kW)'], 0) / validDemands.length 
      : 0;
    
    // Find recent trend (last 3 months vs previous 3 months)
    const recentMonths = maxDemandData.slice(-3);
    const previousMonths = maxDemandData.slice(-6, -3);
    
    const recentAverage = recentMonths.reduce((sum, d) => sum + d['Max Demand (kW)'], 0) / recentMonths.length;
    const previousAverage = previousMonths.length > 0 
      ? previousMonths.reduce((sum, d) => sum + d['Max Demand (kW)'], 0) / previousMonths.length 
      : recentAverage;
    
    const trendPercentage = previousAverage > 0 
      ? ((recentAverage - previousAverage) / previousAverage) * 100 
      : 0;
    
    // Determine alert level
    let alertLevel = 'normal';
    let alertColor = 'text-green-400';
    let alertBgColor = 'bg-green-500/10';
    let alertBorderColor = 'border-green-500/20';
    let alertIcon = BoltIcon;
    
    if (peakEntry['Max Demand (kW)'] > averageDemand * 1.5) {
      alertLevel = 'high';
      alertColor = 'text-red-400';
      alertBgColor = 'bg-red-500/10';
      alertBorderColor = 'border-red-500/20';
      alertIcon = ExclamationTriangleIcon;
    } else if (peakEntry['Max Demand (kW)'] > averageDemand * 1.2) {
      alertLevel = 'moderate';
      alertColor = 'text-yellow-400';
      alertBgColor = 'bg-yellow-500/10';
      alertBorderColor = 'border-yellow-500/20';
      alertIcon = TrendingUpIcon;
    }
    
    return {
      peakDemand: peakEntry['Max Demand (kW)'],
      peakMonth: peakEntry.month,
      averageDemand,
      trendPercentage,
      isIncreasing: trendPercentage > 5,
      isDecreasing: trendPercentage < -5,
      alertLevel,
      alertColor,
      alertBgColor,
      alertBorderColor,
      alertIcon
    };
  }, [maxDemandData]);

  if (!maxDemandData || maxDemandData.length === 0 || !peakInsights) return null;

  const AlertIcon = peakInsights.alertIcon;

  return (
    <Section
      title={t('peakUsageAlert')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="space-y-4">
        {/* Main Peak Usage Card */}
        <div className={`${peakInsights.alertBgColor} ${peakInsights.alertBorderColor} border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-slate-700/50 ${peakInsights.alertColor}`}>
                <AlertIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {t('highestUsage')}: {peakInsights.peakDemand.toFixed(1)} kW
                </h3>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {t('recordedIn')} {peakInsights.peakMonth}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${peakInsights.alertColor}`}>
                {peakInsights.peakDemand.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400">kW</div>
            </div>
          </div>
          
          {/* Comparison with Average */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">{t('comparedToAverage')}</span>
              <span className="text-sm text-slate-400">
                {peakInsights.averageDemand.toFixed(1)} kW {t('average')}
              </span>
            </div>
            
            {/* Visual comparison bar */}
            <div className="relative h-3 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                style={{ width: '60%' }}
              />
              <div 
                className={`absolute top-0 h-full w-1 ${peakInsights.alertColor.replace('text-', 'bg-')} rounded-full`}
                style={{ left: `${Math.min((peakInsights.peakDemand / (peakInsights.averageDemand * 2)) * 100, 100)}%` }}
                title={`${t('peak')}: ${peakInsights.peakDemand.toFixed(1)} kW`}
              />
            </div>
            
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0 kW</span>
              <span>{t('average')}</span>
              <span>{t('peak')}</span>
            </div>
          </div>
        </div>

        {/* Trend and Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon className={`w-4 h-4 ${
                peakInsights.isIncreasing ? 'text-red-400' : 
                peakInsights.isDecreasing ? 'text-green-400' : 'text-blue-400'
              }`} />
              <h4 className="text-sm font-medium text-slate-200">{t('recentTrend')}</h4>
            </div>
            <p className="text-lg font-semibold text-slate-100">
              {peakInsights.trendPercentage > 0 ? '+' : ''}{peakInsights.trendPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400">
              {peakInsights.isIncreasing ? t('increasing') : 
               peakInsights.isDecreasing ? t('decreasing') : t('stable')}
            </p>
          </div>
          
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                peakInsights.alertLevel === 'high' ? 'bg-red-400' :
                peakInsights.alertLevel === 'moderate' ? 'bg-yellow-400' :
                'bg-green-400'
              }`}></div>
              <h4 className="text-sm font-medium text-slate-200">{t('alertLevel')}</h4>
            </div>
            <p className={`text-lg font-semibold ${peakInsights.alertColor}`}>
              {t(peakInsights.alertLevel)}
            </p>
            <p className="text-xs text-slate-400">
              {peakInsights.alertLevel === 'high' ? t('considerReducingPeakUsage') :
               peakInsights.alertLevel === 'moderate' ? t('monitorUsagePatterns') :
               t('usageWithinNormalRange')}
            </p>
          </div>
        </div>

        {/* Recommendation */}
        {peakInsights.alertLevel !== 'normal' && (
          <div className={`${peakInsights.alertBgColor} ${peakInsights.alertBorderColor} border rounded-lg p-4`}>
            <h4 className={`font-medium text-sm ${peakInsights.alertColor} mb-2`}>
              💡 {t('peakUsageRecommendation')}
            </h4>
            <p className="text-sm text-slate-300">
              {peakInsights.alertLevel === 'high' 
                ? t('highPeakRecommendation')
                : t('moderatePeakRecommendation')
              }
            </p>
          </div>
        )}
      </div>
    </Section>
  );
};

export default PeakUsageAlert;
