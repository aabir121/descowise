import React from 'react';
import { WandSparklesIcon, CogIcon, ExclamationTriangleIcon } from '../common/Icons';
import { getDeploymentConfig } from '../../utils/deploymentConfig';
import { hasUserApiKey } from '../../utils/apiKeyStorage';

interface AiFeatureDisabledNoticeProps {
  t: (key: string) => string;
  onSetupApiKey?: () => void;
}

const AiFeatureDisabledNotice: React.FC<AiFeatureDisabledNoticeProps> = ({ t, onSetupApiKey }) => {
  const deploymentConfig = getDeploymentConfig();
  const hasApiKey = hasUserApiKey();

  // Don't show notice for premium deployment with pre-configured API key
  if (deploymentConfig.isPremium && deploymentConfig.hasPreConfiguredApiKey) {
    return null;
  }

  const getNoticeContent = () => {
    if (deploymentConfig.isPremium && !deploymentConfig.hasPreConfiguredApiKey) {
      // Premium deployment but no API key configured
      return {
        icon: <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />,
        title: 'AI Insights Temporarily Unavailable',
        description: 'AI-powered insights are currently unavailable due to API configuration issues. Please contact support.',
        showButton: false,
        bgColor: 'bg-amber-900/30',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-200'
      };
    } else if (!deploymentConfig.isPremium && !hasApiKey) {
      // Standard deployment without user API key
      return {
        icon: <WandSparklesIcon className="w-6 h-6 text-cyan-400" />,
        title: 'Enable AI Insights',
        description: 'Get personalized consumption insights, anomaly detection, and smart recommendations by configuring your Google Gemini API key.',
        showButton: true,
        bgColor: 'bg-cyan-900/20',
        borderColor: 'border-cyan-500/30',
        textColor: 'text-cyan-200'
      };
    } else {
      // Fallback - shouldn't normally reach here
      return {
        icon: <CogIcon className="w-6 h-6 text-slate-400" />,
        title: 'AI Insights Disabled',
        description: 'AI-powered insights are currently disabled.',
        showButton: false,
        bgColor: 'bg-slate-700/30',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-300'
      };
    }
  };

  const content = getNoticeContent();

  return (
    <div className={`${content.bgColor} ${content.borderColor} border rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {content.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100 mb-2">
            {content.title}
          </h3>
          <p className={`${content.textColor} text-sm mb-4 leading-relaxed`}>
            {content.description}
          </p>
          
          {content.showButton && onSetupApiKey && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onSetupApiKey}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CogIcon className="w-4 h-4" />
                Setup API Key
              </button>
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Get API Key
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
          
          {!deploymentConfig.isPremium && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Privacy Note:</strong> Your API key is stored securely on your device and is never shared. 
                You maintain full control over your API usage and costs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiFeatureDisabledNotice;
