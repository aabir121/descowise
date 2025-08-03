import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WandSparklesIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/Icons';

interface ApiKeySetupStepProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  isValidating: boolean;
  error: string | null;
  onValidate: () => void;
  onSkip: () => void;
}

const ApiKeySetupStep: React.FC<ApiKeySetupStepProps> = ({
  apiKey,
  setApiKey,
  isValidating,
  error,
  onValidate,
  onSkip
}) => {
  const { t } = useTranslation();
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <WandSparklesIcon className="w-8 h-8 text-cyan-400" />
          <h2 className="text-2xl font-bold text-slate-100">
            {t('apiKeySetup.title', 'Enable AI Insights (Optional)')}
          </h2>
        </div>
        <p className="text-slate-300 max-w-2xl mx-auto">
          {t('apiKeySetup.description', 'To unlock AI-powered consumption insights and personalized recommendations, provide your Google Gemini API key. This step is optional - you can skip it and still use all other features.')}
        </p>
        <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
          {t('apiKeySetup.skipMessage', 'Don\'t want to set this up now? No problem! You can always add your API key later through the settings menu whenever you\'re ready.')}
        </p>
      </div>

      {/* API Key Input */}
      <div className="bg-slate-700/50 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-200 mb-2">
              {t('apiKeySetup.inputLabel', 'Google Gemini API Key')}
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('apiKeySetup.inputPlaceholder', 'Enter your Gemini API key...')}
                className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                disabled={isValidating}
              >
                {showApiKey ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-900/50 border border-red-500/30 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm">
                <strong>{t('apiKeySetup.validationFailed', 'Validation Failed')}:</strong> {error}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-200 text-sm space-y-2">
              <p><strong>{t('apiKeySetup.howToGetKey', 'How to get your API key')}:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>{t('apiKeySetup.step1', 'Visit')} <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">{t('apiKeySetup.googleAiStudio', 'Google AI Studio')}</a></li>
                <li>{t('apiKeySetup.step2', 'Sign in with your Google account')}</li>
                <li>{t('apiKeySetup.step3', 'Click "Create API Key" and copy it')}</li>
                <li>{t('apiKeySetup.step4', 'Paste it above and click "Validate & Continue"')}</li>
              </ol>
              <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-green-200">{t('apiKeySetup.securityTitle', '🔒 Your API Key Security')}</span>
                </div>
                <ul className="text-xs text-green-100 space-y-0.5 ml-5">
                  <li>{t('apiKeySetup.security1', '• AES-256 encrypted in your browser')}</li>
                  <li>{t('apiKeySetup.security2', '• Never sent to our servers')}</li>
                  <li>{t('apiKeySetup.security3', '• You maintain full control')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onSkip}
          className="px-6 py-3 text-slate-300 hover:text-slate-100 font-medium transition-colors"
          disabled={isValidating}
        >
          {t('apiKeySetup.skipButton', 'Skip for now')}
        </button>
        <button
          onClick={onValidate}
          disabled={isValidating || !apiKey.trim()}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('apiKeySetup.validating', 'Validating...')}
            </>
          ) : (
            t('apiKeySetup.validateButton', 'Validate & Continue')
          )}
        </button>
      </div>
    </div>
  );
};

export default ApiKeySetupStep;
