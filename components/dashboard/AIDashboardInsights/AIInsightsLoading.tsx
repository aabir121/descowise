import React from 'react';
import Spinner from '../../common/Spinner';

type AIInsightsLoadingProps = {
  waitedLong: boolean;
  randomTip: string;
  t: (key: string) => string;
  onRetry: () => void;
};

const AIInsightsLoading: React.FC<AIInsightsLoadingProps> = ({ waitedLong, randomTip, t, onRetry }) => (
  <div className="flex flex-col items-start gap-3 text-purple-400">
    <div className="flex items-center gap-3">
      <Spinner size="w-6 h-6 animate-spin" color="border-purple-400" />
      <span>
        <strong>{t('aiAnalysisGenerating')}</strong>
        <br />
        {t('aiAnalysisMayTakeTime')}
        <br />
        <span className="text-xs">{t('aiAnalysisUsuallyTakes')}</span>
      </span>
    </div>
    <div className="mt-2 text-purple-300 italic">
      {waitedLong
        ? <>{t('aiAnalysisStillWorking')}<br /><button className="underline text-purple-400 hover:text-purple-300" onClick={onRetry}>{t('tryAgain')}</button></>
        : randomTip}
    </div>
  </div>
);

export default AIInsightsLoading; 