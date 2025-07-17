import React from 'react';

type AIInsightsErrorProps = {
  aiError: any;
  t: (key: string) => string;
  onRetry: () => void;
};

function getUserFriendlyAiErrorMessage(aiError: any, t: (key: string) => string) {
  if (!aiError) return null;
  switch (aiError.type) {
    case 'api_key':
      return t('aiUnavailable');
    case 'rate_limit':
      return t('aiRateLimit');
    case 'token_limit':
      return t('aiTooMuchData');
    case 'network':
    case 'timeout':
      return t('aiNetworkIssue');
    case 'safety_block':
      return t('aiSafetyBlock');
    default:
      return t('aiGenericError');
  }
}

const AIInsightsError: React.FC<AIInsightsErrorProps> = ({ aiError, t, onRetry }) => (
  <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-4 text-red-200">
    <div className="font-bold text-red-300 mb-2 flex items-center gap-4">
      {getUserFriendlyAiErrorMessage(aiError, t)}
      {aiError.retryable && (
        <button className="underline text-cyan-400 hover:text-cyan-300 ml-2" onClick={onRetry}>{t('tryAgain')}</button>
      )}
    </div>
  </div>
);

export default AIInsightsError; 