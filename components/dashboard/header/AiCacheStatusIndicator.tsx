import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '../../common/Icons';

interface AiCacheStatusIndicatorProps {
  isUsingCache?: boolean;
  cacheStatus?: {
    isCached: boolean;
    isStale: boolean;
    lastFetch: Date | null;
    timeRemaining: number;
    nextDailyReset: Date;
  };
  onForceRefreshAi?: () => void;
  isRefreshing?: boolean;
  isAiLoading?: boolean;
}

const AiCacheStatusIndicator: React.FC<AiCacheStatusIndicatorProps> = ({
  isUsingCache,
  cacheStatus,
  onForceRefreshAi,
  isRefreshing,
  isAiLoading,
}) => {
  const { t } = useTranslation();

  if (!cacheStatus) return null;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
        isUsingCache
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          : 'bg-slate-700/50 text-slate-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isUsingCache ? 'bg-blue-400' : 'bg-slate-500'
        }`} />
        <span>
          {isUsingCache ? t('cachedAiInsights') : t('freshAiInsights')}
        </span>
        {cacheStatus.isCached && (
          <span className="text-slate-500">
            ({cacheStatus.timeRemaining}m)
          </span>
        )}
      </div>

      {onForceRefreshAi && (
        <button
          onClick={onForceRefreshAi}
          disabled={isRefreshing || isAiLoading}
          className={`p-1 transition-colors ${
            isRefreshing || isAiLoading
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={
            isRefreshing
              ? t('refreshingAiInsights', 'Refreshing AI insights...')
              : isAiLoading
              ? t('aiInsightsLoading', 'AI insights loading...')
              : t('refreshAiInsights', 'Refresh AI insights')
          }
        >
          <RefreshIcon className={`w-4 h-4 ${
            isRefreshing ? 'animate-spin' : ''
          }`} />
        </button>
      )}
    </div>
  );
};

export default AiCacheStatusIndicator;
