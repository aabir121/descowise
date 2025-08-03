// @ts-nocheck
import React, { useMemo } from 'react';
import Section from '../common/Section';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from '../common/Icons';

interface SimpleTrendCardProps {
  boxPlotData: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  } | null;
  banglaEnabled: boolean;
  t: (key: string) => string;
  defaultOpen: boolean;
  sectionId: string;
  showInfoIcon: boolean;
  onInfoClick: () => void;
}

const SimpleTrendCard: React.FC<SimpleTrendCardProps> = ({
  boxPlotData,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick
}) => {
  // Calculate simple trend insights from box plot data
  const trendInsights = useMemo(() => {
    if (!boxPlotData) return null;

    const { min, median, max, q1, q3 } = boxPlotData;
    
    // Calculate variability (how consistent usage is)
    const range = max - min;
    const iqr = q3 - q1; // Interquartile range
    const variabilityPercentage = median > 0 ? (iqr / median) * 100 : 0;
    
    // Determine usage pattern
    let usagePattern = 'consistent';
    let patternColor = 'text-green-400';
    let patternIcon = TrendingUpIcon;
    
    if (variabilityPercentage > 50) {
      usagePattern = 'highly_variable';
      patternColor = 'text-red-400';
      patternIcon = ArrowUpIcon;
    } else if (variabilityPercentage > 25) {
      usagePattern = 'moderately_variable';
      patternColor = 'text-yellow-400';
      patternIcon = ArrowUpIcon;
    }
    
    // Calculate if usage is above or below typical
    const isAboveTypical = median > q1;
    const percentageFromTypical = q1 > 0 ? ((median - q1) / q1) * 100 : 0;
    
    return {
      median: median.toFixed(1),
      min: min.toFixed(1),
      max: max.toFixed(1),
      variabilityPercentage: Math.round(variabilityPercentage),
      usagePattern,
      patternColor,
      patternIcon,
      isAboveTypical,
      percentageFromTypical: Math.abs(Math.round(percentageFromTypical))
    };
  }, [boxPlotData]);

  if (!boxPlotData || !trendInsights) return null;

  const PatternIcon = trendInsights.patternIcon;

  return (
    <Section
      title={t('usagePattern')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="space-y-4">
        {/* Main Trend Card */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-700/50 ${trendInsights.patternColor}`}>
                <PatternIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {t('yourUsageIs')} {t(trendInsights.usagePattern)}
                </h3>
                <p className="text-sm text-slate-400">
                  {t('typicalDaily')}: {trendInsights.median} {t('kWh')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${trendInsights.patternColor}`}>
                {trendInsights.variabilityPercentage}%
              </div>
              <div className="text-xs text-slate-400">{t('variation')}</div>
            </div>
          </div>
          
          {/* Usage Range */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">{t('usageRange')}</span>
              <span className="text-sm text-slate-400">
                {trendInsights.min} - {trendInsights.max} {t('kWh')}
              </span>
            </div>
            
            {/* Visual range indicator */}
            <div className="relative h-2 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                style={{ width: '60%' }}
              />
              <div 
                className="absolute top-0 h-full w-1 bg-cyan-400 rounded-full"
                style={{ left: '60%' }}
                title={`${t('typical')}: ${trendInsights.median} kWh`}
              />
            </div>
            
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{t('lowest')}</span>
              <span>{t('typical')}</span>
              <span>{t('highest')}</span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <h4 className="text-sm font-medium text-slate-200">{t('consistencyLevel')}</h4>
            </div>
            <p className="text-xs text-slate-300">
              {trendInsights.variabilityPercentage < 25 
                ? t('veryConsistent') 
                : trendInsights.variabilityPercentage < 50 
                ? t('moderatelyConsistent') 
                : t('highlyVariable')
              }
            </p>
          </div>
          
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h4 className="text-sm font-medium text-slate-200">{t('recommendation')}</h4>
            </div>
            <p className="text-xs text-slate-300">
              {trendInsights.variabilityPercentage > 50 
                ? t('tryToMaintainConsistentUsage')
                : t('goodUsagePattern')
              }
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default SimpleTrendCard;
