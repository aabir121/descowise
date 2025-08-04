// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import { getDashboardLabel } from './dashboardLabels';
import { formatCurrency, sanitizeCurrency } from '../common/format';
import { InformationCircleIcon } from '../common/Icons';
import { useBalanceWarning } from '../../hooks/useBalanceWarning';
import BalanceAiInsights from './AiInsights/BalanceAiInsights';
import { DistributedAiInsights } from '../../utils/aiInsightDistribution';
import { SkeletonAccountBalance, LoadingStateWrapper } from '../common/SkeletonComponents';


const AccountBalanceSection = ({
  gaugeData,
  banglaEnabled,
  balanceUnavailable,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick,
  aiInsight,
  aiError,
  isAiBalanceLoading,
  estimatedDaysRemaining,
  // New props for distributed AI insights
  balanceAiInsights,
  isAiLoading,
  isDataLoading = false
}) => {
  const { open: openBalanceWarning } = useBalanceWarning();

  // Show skeleton when data is loading
  if (isDataLoading || (!gaugeData && !balanceUnavailable)) {
    return (
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 bg-slate-700 rounded w-32 animate-pulse" />
            {showInfoIcon && (
              <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance gauge skeleton */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-700/50 rounded-xl">
              <div className="animate-pulse">
                <div className="w-32 h-32 bg-slate-700 rounded-full mb-4" />
                <div className="h-6 bg-slate-700 rounded w-24 mx-auto mb-2" />
                <div className="h-4 bg-slate-700 rounded w-16 mx-auto" />
              </div>
            </div>

            {/* Balance details skeleton */}
            <div className="space-y-4">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="h-4 bg-slate-700 rounded w-20 mb-2 animate-pulse" />
                <div className="h-4 bg-slate-700 rounded w-32 animate-pulse" />
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="h-4 bg-slate-700 rounded w-24 mb-2 animate-pulse" />
                <div className="h-4 bg-slate-700 rounded w-28 animate-pulse" />
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="h-4 bg-slate-700 rounded w-16 mb-2 animate-pulse" />
                <div className="h-6 bg-slate-700 rounded-full w-20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Section
      title={getDashboardLabel('balance', banglaEnabled) + ' ' + getDashboardLabel('status', banglaEnabled)}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
      isAiLoading={isAiLoading}
      aiLoadingText={t('analyzingBalance')}
    >
      {/* AI Insights - First content item */}
      {balanceAiInsights && (
        <BalanceAiInsights insights={balanceAiInsights} t={t} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-6 bg-slate-700/50 rounded-xl">
          {balanceUnavailable ? (
            <>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                  N/A
                  <button
                    onClick={() => openBalanceWarning()}
                    className="p-1 rounded hover:bg-slate-700 focus:outline-none"
                    aria-label={t('balanceTemporarilyUnavailable')}
                  >
                    <InformationCircleIcon className="w-6 h-6 text-yellow-400 hover:text-yellow-300" />
                  </button>
                </div>
                <div className="text-sm text-yellow-400 mt-2">{t('balanceTemporarilyUnavailable')}</div>
              </div>

            </>
          ) : (
            <>
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#374151"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={gaugeData.percentage > 50 ? "#22c55e" : gaugeData.percentage > 25 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - gaugeData.percentage / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{gaugeData.percentage.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400">{t('ofMonthlyAvg')}</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {formatCurrency(sanitizeCurrency(gaugeData.currentBalance))}
                </div>
                <div className="text-sm text-slate-400">{getDashboardLabel('balance', banglaEnabled)}</div>
              </div>
            </>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">{getDashboardLabel('monthlyCostTrend', banglaEnabled)}</h5>
            <div className="text-xl font-bold text-orange-400">
              {gaugeData ? formatCurrency(sanitizeCurrency(gaugeData.averageMonthlyCost)) : '—'}
            </div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">{t('estimatedDaysRemaining')}</h5>
            <div className="text-xl font-bold text-green-400">{(typeof estimatedDaysRemaining === 'number' && !isNaN(estimatedDaysRemaining)) ? estimatedDaysRemaining : (gaugeData && !balanceUnavailable ? gaugeData.daysRemaining : '—')} {t('days')}</div>
            {/* AI-powered note below days remaining */}
            <div className="mt-3 min-h-[20px]">
              {isAiBalanceLoading && (
                <span className="flex items-center gap-1 text-xs text-purple-400"><span className="animate-spin inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full"></span> AI analyzing...</span>
              )}
              {aiError && !isAiBalanceLoading && (
                <span className="text-xs text-red-400">AI: {aiError}</span>
              )}
              {aiInsight && !isAiBalanceLoading && !aiError && (
                <span className="text-xs text-purple-400 flex items-center gap-1"><span className="font-semibold bg-purple-100 text-purple-600 px-1 rounded">AI</span> {String(aiInsight)}</span>
              )}
            </div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">{getDashboardLabel('status', banglaEnabled)}</h5>
            <div className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
              gaugeData && !balanceUnavailable ? (
                gaugeData.percentage > 50 ? 'bg-green-500/20 text-green-300' :
                gaugeData.percentage > 25 ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              ) : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {gaugeData && !balanceUnavailable ? (
                gaugeData.percentage > 50 ? t('good') : 
                  gaugeData.percentage > 25 ? t('warning') : t('low')
              ) : t('unknown')}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AccountBalanceSection; 