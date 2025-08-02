import React from 'react';
import { useTranslation } from 'react-i18next';
import { WandSparklesIcon, ExclamationTriangleIcon, ArrowRightIcon } from './Icons';

interface ApiKeyPromptProps {
  variant?: 'banner' | 'card' | 'inline';
  onSetupClick: () => void;
  onDismiss?: () => void;
  className?: string;
  showDismiss?: boolean;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({
  variant = 'banner',
  onSetupClick,
  onDismiss,
  className = '',
  showDismiss = false
}) => {
  const { t } = useTranslation();

  const baseContent = {
    title: t('enableAiFeatures', 'Enable AI Features'),
    description: t('aiFeatureRequiresApiKey', 'AI features require a Google Gemini API key to function.'),
    actionText: t('setupApiKey', 'Setup API Key')
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-3 sm:p-4 ${className}`}>
        <div className="flex items-start gap-2 sm:gap-3">
          <WandSparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-cyan-100 text-sm sm:text-base truncate pr-2">{baseContent.title}</h3>
              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-cyan-300 hover:text-cyan-100 text-lg sm:text-xl flex-shrink-0 w-6 h-6 flex items-center justify-center"
                  aria-label={t('dismiss', 'Dismiss')}
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-cyan-200 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed">{baseContent.description}</p>
            <p className="text-cyan-100 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
              {t('clickToSetupApiKey', 'Click here to set up your API key and unlock AI insights.')}
            </p>
            <button
              onClick={onSetupClick}
              className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors text-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              <WandSparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{baseContent.actionText}</span>
              <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-slate-700/50 border border-slate-600 rounded-lg p-3 sm:p-4 ${className}`}>
        <div className="text-center">
          <WandSparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 mx-auto mb-2 sm:mb-3" />
          <h3 className="font-semibold text-slate-100 mb-2 text-sm sm:text-base">{baseContent.title}</h3>
          <p className="text-slate-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">{baseContent.description}</p>
          <button
            onClick={onSetupClick}
            className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {baseContent.actionText}
          </button>
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
        <p className="text-yellow-100 text-xs sm:text-sm leading-relaxed">{baseContent.description}</p>
      </div>
      <button
        onClick={onSetupClick}
        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-medium rounded text-xs sm:text-sm transition-colors w-full sm:w-auto flex-shrink-0"
      >
        {t('setup', 'Setup')}
      </button>
    </div>
  );
};

export default ApiKeyPrompt;
