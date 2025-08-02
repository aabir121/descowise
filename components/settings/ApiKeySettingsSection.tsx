import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WandSparklesIcon, KeyIcon, ShieldCheckIcon, ExclamationTriangleIcon, CogIcon } from '../common/Icons';
import { hasStoredApiKey, getApiKeyDisplayFormat, getApiKeyValidationStatus } from '../../utils/apiKeyStorage';
import ApiKeyStatusIndicator from '../common/ApiKeyStatusIndicator';

interface ApiKeySettingsSectionProps {
  onOpenApiKeyModal: () => void;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const ApiKeySettingsSection: React.FC<ApiKeySettingsSectionProps> = ({
  onOpenApiKeyModal,
  className = '',
  showTitle = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyDisplay, setApiKeyDisplay] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApiKeyStatus = async () => {
      setIsLoading(true);
      try {
        const hasKey = hasStoredApiKey();
        setHasApiKey(hasKey);
        
        if (hasKey) {
          const display = await getApiKeyDisplayFormat();
          const status = getApiKeyValidationStatus();
          setApiKeyDisplay(display);
          setValidationStatus(status);
        }
      } catch (error) {
        console.error('Error checking API key status:', error);
        setHasApiKey(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKeyStatus();
  }, []);

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: KeyIcon,
        bgColor: 'bg-slate-600/20',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/30',
        status: t('checking', 'Checking...'),
        description: t('checkingApiKeyStatus', 'Checking API key status...')
      };
    }

    if (hasApiKey) {
      const isValid = validationStatus?.isValid && !validationStatus?.isExpired;
      return {
        icon: ShieldCheckIcon,
        bgColor: isValid ? 'bg-green-600/20' : 'bg-yellow-600/20',
        textColor: isValid ? 'text-green-400' : 'text-yellow-400',
        borderColor: isValid ? 'border-green-500/30' : 'border-yellow-500/30',
        status: isValid ? t('apiKeyConfigured', 'API Key Configured') : t('apiKeyNeedsUpdate', 'API Key Needs Update'),
        description: isValid 
          ? t('aiFeaturesFunctional', 'AI features are fully functional')
          : t('apiKeyRequiresRevalidation', 'API key requires revalidation')
      };
    }

    return {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-red-600/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      status: t('apiKeyNotConfigured', 'API Key Not Configured'),
      description: t('aiFeatureRequiresApiKey', 'AI features require a Google Gemini API key to function.')
    };
  };

  const statusConfig = getStatusConfig();
  const IconComponent = statusConfig.icon;

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 bg-slate-700/30 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${statusConfig.textColor}`} />
          <div>
            <div className="text-sm font-medium text-slate-100">{t('aiFeatures', 'AI Features')}</div>
            <div className={`text-xs ${statusConfig.textColor}`}>{statusConfig.status}</div>
          </div>
        </div>
        <button
          onClick={onOpenApiKeyModal}
          className="px-3 py-1.5 bg-cyan-500/80 hover:bg-cyan-600 text-white text-sm font-medium rounded transition-colors"
        >
          {hasApiKey ? t('manage', 'Manage') : t('setup', 'Setup')}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2">
          <WandSparklesIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100">{t('aiFeatures', 'AI Features')}</h3>
        </div>
      )}

      <div className={`p-4 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
        <div className="flex items-start gap-3">
          <IconComponent className={`w-6 h-6 ${statusConfig.textColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold ${statusConfig.textColor}`}>{statusConfig.status}</h4>
              <ApiKeyStatusIndicator 
                variant="compact" 
                size="sm" 
                onClick={onOpenApiKeyModal}
                showTooltip={false}
              />
            </div>
            <p className="text-slate-300 text-sm mb-3">{statusConfig.description}</p>
            
            {hasApiKey && (
              <div className="bg-slate-800/50 rounded p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">{t('currentApiKey', 'Current API Key')}</div>
                    <code className="text-sm text-slate-200">{apiKeyDisplay}</code>
                  </div>
                  {validationStatus && (
                    <div className="flex items-center gap-1">
                      {validationStatus.isValid && !validationStatus.isExpired ? (
                        <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                          {t('valid', 'Valid')}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded">
                          {validationStatus.isExpired ? t('expired', 'Expired') : t('invalid', 'Invalid')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onOpenApiKeyModal}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
              >
                <CogIcon className="w-4 h-4" />
                {hasApiKey ? t('manageApiKey', 'Manage API Key') : t('setupApiKey', 'Setup API Key')}
              </button>
              
              {!hasApiKey && (
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 font-medium rounded-lg transition-colors text-center"
                >
                  <KeyIcon className="w-4 h-4" />
                  {t('getApiKey', 'Get API Key')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {!hasApiKey && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-blue-200 mb-2">{t('whyApiKey', 'Why do I need an API key?')}</h4>
          <ul className="text-blue-100 text-sm space-y-1">
            <li>• {t('aiFeatureBenefit1', 'Get personalized consumption insights and recommendations')}</li>
            <li>• {t('aiFeatureBenefit2', 'Detect unusual usage patterns and potential issues')}</li>
            <li>• {t('aiFeatureBenefit3', 'Receive predictive billing and usage forecasts')}</li>
            <li>• {t('aiFeatureBenefit4', 'Access smart energy-saving tips tailored to your usage')}</li>
          </ul>
          <div className="mt-3 text-xs text-blue-200">
            <strong>{t('privacy', 'Privacy'):</strong> {t('apiKeyPrivacyNote', 'Your API key is encrypted and stored locally on your device. It never leaves your browser.')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeySettingsSection;
