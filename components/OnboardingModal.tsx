import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BoltIcon, CloseIcon, GlobeAltIcon, InformationCircleIcon, CogIcon, WandSparklesIcon, ExclamationTriangleIcon } from './common/Icons';
import { getDeploymentConfig } from '../utils/deploymentConfig';
import { storeUserApiKey } from '../utils/apiKeyStorage';
import { validateApiKey } from '../services/descoService';
import ApiKeySetupStep from './ApiKeySetupStep';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageSelect: (language: 'en' | 'bn') => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onLanguageSelect }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'bn'>(i18n.language as 'en' | 'bn');
  const [currentStep, setCurrentStep] = useState<'language' | 'apikey' | 'complete'>('language');
  const [apiKey, setApiKey] = useState('');
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const deploymentConfig = getDeploymentConfig();

  // Update selected language when i18n language changes
  useEffect(() => {
    setSelectedLanguage(i18n.language as 'en' | 'bn');
  }, [i18n.language]);

  if (!isOpen) return null;

  const handleLanguageSelect = (language: 'en' | 'bn') => {
    setSelectedLanguage(language);
    onLanguageSelect(language);
  };

  const handleLanguageNext = () => {
    if (deploymentConfig.showApiKeySetup) {
      setCurrentStep('apikey');
    } else {
      handleGetStarted();
    }
  };

  const handleApiKeyValidation = async () => {
    if (!apiKey.trim()) {
      // Skip API key setup
      handleGetStarted();
      return;
    }

    setIsValidatingApiKey(true);
    setApiKeyError(null);

    try {
      const result = await validateApiKey(apiKey.trim());
      if (result.isValid) {
        storeUserApiKey(apiKey.trim());
        handleGetStarted();
      } else {
        setApiKeyError(result.error || 'Invalid API key');
      }
    } catch (error) {
      setApiKeyError('Failed to validate API key');
    } finally {
      setIsValidatingApiKey(false);
    }
  };

  const handleSkipApiKey = () => {
    setApiKey('');
    handleGetStarted();
  };

  const handleGetStarted = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BoltIcon className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-slate-100">DescoWise</h1>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close onboarding"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Language Selection Step */}
          {currentStep === 'language' && (
            <>
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-100 mb-4">
                  {t('onboardingTitle')}
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  {t('onboardingSubtitle')}
                </p>
              </div>

          {/* Language Selection */}
          <div className="bg-slate-700/50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <GlobeAltIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-slate-100">
                {selectedLanguage === 'en' ? 'Choose Your Language' : 'আপনার ভাষা বেছে নিন'}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleLanguageSelect('en')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLanguage === 'en'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-600/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">English</div>
                  <div className="text-sm opacity-75">Continue in English</div>
                </div>
              </button>
              <button
                onClick={() => handleLanguageSelect('bn')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLanguage === 'bn'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-600/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">বাংলা</div>
                  <div className="text-sm opacity-75">বাংলায় চালিয়ে যান</div>
                </div>
              </button>
            </div>
          </div>

          {/* Why DescoWise Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-slate-100">
                {t('whyDescoWise')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 rounded-lg p-5">
                <h4 className="font-semibold text-slate-100 mb-3">
                  {t('beyondOfficialPortal')}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {t('beyondOfficialPortalDesc')}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-5">
                <h4 className="font-semibold text-slate-100 mb-3">
                  {t('privacyFirst')}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {t('privacyFirstDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <WandSparklesIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-slate-100">
                {t('keyFeatures')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl mb-2">🤖</div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('aiInsightsFeature')}
                </h4>
                <p className="text-slate-300 text-sm">
                  {t('aiInsightsFeatureDesc')}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('smartAnalytics')}
                </h4>
                <p className="text-slate-300 text-sm">
                  {t('smartAnalyticsDesc')}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl mb-2">💰</div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('costOptimization')}
                </h4>
                <p className="text-slate-300 text-sm">
                  {t('costOptimizationDesc')}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('securePrivate')}
                </h4>
                <p className="text-slate-300 text-sm">
                  {t('securePrivateDesc')}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl mb-2">🌐</div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('bilingualSupport')}
                </h4>
                <p className="text-slate-300 text-sm">
                  {t('bilingualSupportDesc')}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('realTimeData')}
                </h4>
                <p className="text-slate-300 text-sm">
                  {t('realTimeDataDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <CogIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-slate-100">
                {t('howItWorks')}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">
                    {t('step1Title')}
                  </h4>
                  <p className="text-slate-300 text-sm">
                    {t('step1Desc')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">
                    {t('step2Title')}
                  </h4>
                  <p className="text-slate-300 text-sm">
                    {t('step2Desc')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">
                    {t('step3Title')}
                  </h4>
                  <p className="text-slate-300 text-sm">
                    {t('step3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Reliability & Limitations */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <ExclamationTriangleIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-slate-100">
                {t('dataReliability')}
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Data Source */}
              <div className="bg-slate-700/30 rounded-lg p-5">
                <h4 className="font-semibold text-slate-100 mb-3">
                  {t('dataSourceTitle')}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {t('dataSourceDesc')}
                </p>
              </div>
              
              {/* Data Limitations */}
              <div className="bg-slate-700/30 rounded-lg p-5">
                <h4 className="font-semibold text-slate-100 mb-3">
                  {t('dataLimitationsTitle')}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  {t('dataLimitationsDesc')}
                </p>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('dataLimitationReason1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('dataLimitationReason2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('dataLimitationReason3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('dataLimitationReason4')}</span>
                  </li>
                </ul>
                <p className="text-slate-300 text-sm leading-relaxed mt-3 italic">
                  {t('dataLimitationNote')}
                </p>
              </div>
              
              {/* What You Can Do */}
              <div className="bg-slate-700/30 rounded-lg p-5">
                <h4 className="font-semibold text-slate-100 mb-3">
                  {t('whatToDoTitle')}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  {t('whatToDoDesc')}
                </p>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('whatToDoAction1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('whatToDoAction2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('whatToDoAction3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('whatToDoAction4')}</span>
                  </li>
                </ul>
                <p className="text-slate-300 text-sm leading-relaxed mt-3 font-medium">
                  {t('dataAccuracyNote')}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-700/30 rounded-lg p-5 mb-8">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-100 mb-2">
                  {t('importantNote')}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {t('importantNoteDesc')}
                </p>
              </div>
            </div>
          </div>
            </>
          )}

          {/* API Key Setup Step */}
          {currentStep === 'apikey' && (
            <ApiKeySetupStep
              apiKey={apiKey}
              setApiKey={setApiKey}
              isValidating={isValidatingApiKey}
              error={apiKeyError}
              onValidate={handleApiKeyValidation}
              onSkip={handleSkipApiKey}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 rounded-b-2xl">
          <div className="flex justify-end">
            {currentStep === 'language' && (
              <button
                onClick={handleLanguageNext}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                {deploymentConfig.showApiKeySetup ? 'Continue' : t('getStarted')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal; 