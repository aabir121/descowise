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
            Enable AI Insights (Optional)
          </h2>
        </div>
        <p className="text-slate-300 max-w-2xl mx-auto">
          To unlock AI-powered consumption insights and personalized recommendations, 
          provide your Google Gemini API key. This step is optional - you can skip it 
          and still use all other features.
        </p>
      </div>

      {/* API Key Input */}
      <div className="bg-slate-700/50 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-200 mb-2">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
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
                <strong>Validation Failed:</strong> {error}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-200 text-sm space-y-2">
              <p><strong>How to get your API key:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key" and copy it</li>
                <li>Paste it above and click "Validate & Continue"</li>
              </ol>
              <p className="mt-2 text-xs text-blue-300">
                <strong>Privacy:</strong> Your API key is stored securely on your device and never shared.
              </p>
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
          Skip for now
        </button>
        <button
          onClick={onValidate}
          disabled={isValidating || !apiKey.trim()}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Validating...
            </>
          ) : (
            'Validate & Continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default ApiKeySetupStep;
