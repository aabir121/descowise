import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WandSparklesIcon, ArrowLeftIcon, ArrowRightIcon, CloseIcon, InformationCircleIcon } from './Icons';
import { hasStoredApiKey } from '../../utils/apiKeyStorage';

interface ApiKeyGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal: () => void;
}

interface TourStep {
  id: string;
  title: string;
  content: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ApiKeyGuidedTour: React.FC<ApiKeyGuidedTourProps> = ({
  isOpen,
  onClose,
  onOpenApiKeyModal
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    setHasApiKey(hasStoredApiKey());
  }, []);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      title: t('tourWelcomeTitle', 'Welcome to AI-Powered Insights'),
      content: t('tourWelcomeContent', 'DescoWise can provide intelligent insights about your electricity consumption using AI. Let us show you how to get started.')
    },
    {
      id: 'benefits',
      title: t('tourBenefitsTitle', 'What You\'ll Get'),
      content: t('tourBenefitsContent', 'AI insights include: personalized consumption analysis, anomaly detection, smart recommendations, predictive billing, and energy-saving tips tailored to your usage patterns.')
    },
    {
      id: 'privacy',
      title: t('tourPrivacyTitle', 'Your Privacy Matters'),
      content: t('tourPrivacyContent', 'Your API key is encrypted with AES-256 and stored only on your device. It never leaves your browser and you have complete control over it.')
    },
    {
      id: 'setup',
      title: hasApiKey ? t('tourManageTitle', 'Manage Your API Key') : t('tourSetupTitle', 'Ready to Get Started?'),
      content: hasApiKey 
        ? t('tourManageContent', 'You already have an API key configured. You can update, validate, or remove it anytime from the settings.')
        : t('tourSetupContent', 'Click below to set up your Google Gemini API key and unlock all AI features. The process takes less than 2 minutes.'),
      action: {
        label: hasApiKey ? t('manageApiKey', 'Manage API Key') : t('setupApiKey', 'Setup API Key'),
        onClick: () => {
          onOpenApiKeyModal();
          onClose();
        }
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('apiKeyTourCompleted', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <WandSparklesIcon className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">{step.title}</h2>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={t('close', 'Close')}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <InformationCircleIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 leading-relaxed">{step.content}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Action button for last step */}
          {step.action && (
            <div className="mb-6">
              <button
                onClick={step.action.onClick}
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <WandSparklesIcon className="w-5 h-5" />
                {step.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            {t('skip', 'Skip')}
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-slate-100 font-medium transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t('previous', 'Previous')}
              </button>
            )}

            {!isLastStep && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {t('next', 'Next')}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}

            {isLastStep && !step.action && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
              >
                {t('getStarted', 'Get Started')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGuidedTour;

// Contextual Help Tooltip Component
interface ContextualHelpProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  content,
  position = 'top',
  className = '',
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-700',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-700',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-700',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-700'
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg border border-slate-600">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};
