import React, { useState, useEffect } from 'react';
import { CloseIcon, WandSparklesIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/Icons';
import { getUserApiKey, storeUserApiKey, removeUserApiKey, getApiKeyDisplayFormat, getApiKeyValidationStatus } from '../utils/apiKeyStorage';
import { validateApiKey } from '../services/descoService';


interface ApiKeyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyUpdated?: () => void;
}

const ApiKeyManagementModal: React.FC<ApiKeyManagementModalProps> = ({ isOpen, onClose, onApiKeyUpdated }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [existingKeyDisplay, setExistingKeyDisplay] = useState<string | null>(null);
  


  useEffect(() => {
    if (isOpen) {
      const checkExistingKey = async () => {
        const existingKey = await getUserApiKey();
        setHasExistingKey(!!existingKey);
        setApiKey('');
        setValidationError(null);
        setValidationSuccess(false);
        setShowApiKey(false);

        // Set the display format for existing key
        if (existingKey) {
          const displayFormat = await getApiKeyDisplayFormat(existingKey);
          setExistingKeyDisplay(displayFormat);
        } else {
          setExistingKeyDisplay(null);
        }
      };
      checkExistingKey();
    }
  }, [isOpen]);

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) {
      setValidationError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      const result = await validateApiKey(apiKey.trim());
      if (result.isValid) {
        await storeUserApiKey(apiKey.trim());
        setValidationSuccess(true);
        setValidationError(null);

        // Close modal after a brief success display
        setTimeout(() => {
          onApiKeyUpdated?.();
          onClose();
        }, 1500);
      } else {
        setValidationError(result.error || 'Invalid API key');
        setValidationSuccess(false);
      }
    } catch (error) {
      console.error('API key validation error:', error);
      setValidationError('Failed to validate API key');
      setValidationSuccess(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    setShowRemoveConfirmation(true);
  };

  const handleConfirmRemove = () => {
    removeUserApiKey();
    setHasExistingKey(false);
    setExistingKeyDisplay(null);
    setApiKey('');
    setValidationError(null);
    setValidationSuccess(false);
    setShowRemoveConfirmation(false);
    onApiKeyUpdated?.();
    onClose();
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmation(false);
  };

  if (!isOpen) return null;

  const validationStatus = getApiKeyValidationStatus();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WandSparklesIcon className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-slate-100">
                {hasExistingKey ? 'Manage AI API Key' : 'Setup AI Features'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close modal"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Welcome Message for New Users */}
          {!hasExistingKey && (
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <WandSparklesIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyan-100 mb-2">Unlock AI-Powered Insights</h3>
                  <p className="text-cyan-200 text-sm mb-3">
                    Get personalized consumption insights, anomaly detection, smart recommendations, and predictive analytics by configuring your Google Gemini API key.
                  </p>
                  <div className="text-cyan-100 text-xs">
                    <strong>What you'll get:</strong>
                    <ul className="mt-1 space-y-1 text-cyan-200">
                      <li>• Smart consumption pattern analysis</li>
                      <li>• Personalized energy-saving recommendations</li>
                      <li>• Anomaly detection and alerts</li>
                      <li>• Predictive billing and usage forecasts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Status */}
          {hasExistingKey && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Current API Key</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <code className="text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded">
                    {existingKeyDisplay}
                  </code>
                  {validationStatus && (
                    <div className="flex items-center gap-1">
                      {validationStatus.isValid && !validationStatus.isExpired ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">Valid</span>
                        </>
                      ) : (
                        <>
                          <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-amber-400">
                            {validationStatus.isExpired ? 'Needs revalidation' : 'Invalid'}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRemoveApiKey}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-200 mb-2">
                {hasExistingKey ? 'Update API Key' : 'Enter API Key'}
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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

            {/* Validation Messages */}
            {validationError && (
              <div className="flex items-start gap-3 p-3 bg-red-900/50 border border-red-500/30 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-200 text-sm">
                  <strong>Validation Failed:</strong> {validationError}
                </div>
              </div>
            )}

            {validationSuccess && (
              <div className="flex items-start gap-3 p-3 bg-green-900/50 border border-green-500/30 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-green-200 text-sm">
                  <strong>Success:</strong> API key validated and saved successfully!
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-blue-200 text-sm space-y-2">
                  <p><strong>Get your API key:</strong></p>
                  <p>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Google AI Studio</a> to create a free API key.</p>
                </div>
              </div>

              {/* Security Information */}
              <div className="flex items-start gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-green-200 text-sm space-y-1">
                  <p><strong>🔒 Your API Key Security:</strong></p>
                  <ul className="text-xs text-green-100 space-y-1 ml-2">
                    <li>• <strong>AES-256 encrypted</strong> before storing in your browser</li>
                    <li>• <strong>Never transmitted</strong> to our servers</li>
                    <li>• <strong>Stays on your device</strong> - you have complete control</li>
                    <li>• <strong>Can be removed</strong> anytime from settings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 rounded-b-2xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-slate-100 font-medium transition-colors"
              disabled={isValidating}
            >
              Cancel
            </button>
            <button
              onClick={handleValidateAndSave}
              disabled={isValidating || !apiKey.trim() || validationSuccess}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validating...
                </>
              ) : validationSuccess ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Validate & Save'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      {showRemoveConfirmation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-10">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-2 sm:gap-3 mb-4">
              <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-2">Remove API Key</h3>
                <p className="text-slate-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  Are you sure you want to remove your API key? This will disable all AI features until you configure a new key.
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-red-200 text-xs font-semibold mb-1">
                    What will happen:
                  </p>
                  <ul className="text-red-100 text-xs space-y-0.5 sm:space-y-1">
                    <li>• AI insights will be disabled for all accounts</li>
                    <li>• Smart recommendations will no longer be available</li>
                    <li>• Consumption analysis features will be limited</li>
                    <li>• You can re-enable by adding a new API key anytime</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancelRemove}
                className="px-3 py-2 sm:px-4 sm:py-2 text-slate-300 hover:text-slate-100 font-medium transition-colors text-sm order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm order-1 sm:order-2"
              >
                Remove API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagementModal;
