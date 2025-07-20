import React from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from '../common/Spinner';
import { BoltIcon, InformationCircleIcon } from '../common/Icons';
import { formatCurrency } from '../common/format';
import { formatHumanDate } from '../../utils/dataSanitization';

import { useBalanceWarning } from '../../hooks/useBalanceWarning';

interface BalanceDisplayProps {
  isLoading: boolean;
  balance: string | number | null | undefined;
  readingTime?: string;
  naClassName?: string; // Add this prop
  aiBalanceEstimate?: string | number | null; // AI-estimated balance
  aiInsight?: string; // AI-powered insight or trend
  isAiLoading?: boolean;
  aiError?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ isLoading, balance, readingTime, naClassName, aiBalanceEstimate, aiInsight, isAiLoading, aiError }) => {
  const { t } = useTranslation();
  const { open: openBalanceWarning } = useBalanceWarning();
  const hasBalance = balance !== null && balance !== undefined;
  const balanceValue = hasBalance ? parseFloat(String(balance).replace(/[^\d.-]/g, '')) : 0;
  const balanceDisplay = formatCurrency(balance);
  const balanceColor = !isNaN(balanceValue) && balanceValue >= 0 ? 'text-cyan-400' : 'text-red-400';

  // AI estimate formatting
  const hasAiEstimate = aiBalanceEstimate !== null && aiBalanceEstimate !== undefined && aiBalanceEstimate !== '';
  const aiEstimateDisplay = hasAiEstimate ? formatCurrency(aiBalanceEstimate) : null;

  if (isLoading) {
    return <Spinner size="w-7 h-7" color="border-slate-400" />;
  }

  if (!hasBalance) {
    return (
      <>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className={naClassName ? naClassName + " flex items-baseline" : "font-bold text-2xl text-yellow-400 flex items-baseline"}>
              N/A
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openBalanceWarning();
              }}
              className="p-1 rounded hover:bg-slate-700 focus:outline-none"
              aria-label={t('moreInfoUnavailableBalance')}
            >
              <InformationCircleIcon className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
            </button>
          </div>
          <p className="text-xs text-yellow-400 mt-1">
            {t('balanceTemporarilyUnavailable')}
          </p>
          {readingTime && (
            <p className="text-xs text-slate-500 mt-1">
              {t('lastUpdated', { date: formatHumanDate(new Date(readingTime)) })}
            </p>
          )}
          {/* AI analysis for unavailable balance */}
          <div className="mt-2">
            {isAiLoading && (
              <div className="flex items-center gap-1 text-xs text-purple-400"><Spinner size="w-4 h-4" color="border-purple-400" /> <span>AI {t('analyzingBalance')}</span></div>
            )}
            {aiError && (
              <div className="text-xs text-red-400">AI: {aiError}</div>
            )}
            {aiInsight && !isAiLoading && !aiError && (
              <div className="text-xs text-purple-400 flex items-center gap-1"><span className="font-semibold bg-purple-100 text-purple-600 px-1 rounded">AI</span> {aiInsight}</div>
            )}
            {hasAiEstimate && !isAiLoading && !aiError && (
              <div className="text-xs text-purple-400 flex items-center gap-1"><span className="font-semibold bg-purple-100 text-purple-600 px-1 rounded">AI</span> {t('aiEstimatedBalance')}: <span className="font-bold">{aiEstimateDisplay}</span></div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        <BoltIcon className={`w-5 h-5 mt-0.5 ${balanceColor}`} />
        <span className={`font-bold text-2xl ${balanceColor} flex items-baseline`}>
          <span className="mr-0.5">৳</span>
          <span>{balanceDisplay.replace(/^৳/, '')}</span>
        </span>
      </div>
      {readingTime && (
        <p className="text-xs text-slate-500 mt-1">
          {t('lastUpdated', { date: formatHumanDate(new Date(readingTime)) })}
        </p>
      )}
      {/* AI analysis for available balance */}
      <div className="mt-2">
        {isAiLoading && (
          <div className="flex items-center gap-1 text-xs text-purple-400"><Spinner size="w-4 h-4" color="border-purple-400" /> <span>AI {t('analyzingBalance')}</span></div>
        )}
        {aiError && (
          <div className="text-xs text-red-400">AI: {aiError}</div>
        )}
        {aiInsight && !isAiLoading && !aiError && (
          <div className="text-xs text-purple-400 flex items-center gap-1"><span className="font-semibold bg-purple-100 text-purple-600 px-1 rounded">AI</span> {aiInsight}</div>
        )}
        {hasAiEstimate && !isAiLoading && !aiError && (
          <div className="text-xs text-purple-400 flex items-center gap-1"><span className="font-semibold bg-purple-100 text-purple-600 px-1 rounded">AI</span> {t('aiEstimatedBalance')}: <span className="font-bold">{aiEstimateDisplay}</span></div>
        )}
      </div>
    </div>
  );
};

export default BalanceDisplay; 