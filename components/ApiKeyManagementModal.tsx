import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, WandSparklesIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/Icons';
import { getUserApiKey, storeUserApiKey, removeUserApiKey, getApiKeyDisplayFormat, getApiKeyValidationStatus } from '../utils/apiKeyStorage';
import { validateApiKey } from '../services/descoService';


interface ApiKeyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyUpdated?: () => void;
}

const ApiKeyManagementModal: React.FC<ApiKeyManagementModalProps> = ({ isOpen, onClose, onApiKeyUpdated }) => {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  


  useEffect(() => {
    if (isOpen) {
      const existingKey = getUserApiKey();
      setHasExistingKey(!!existingKey);
      setApiKey('');
      setValidationError(null);
      setValidationSuccess(false);
      setShowApiKey(false);
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
        storeUserApiKey(apiKey.trim());
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
      setValidationError('Failed to validate API key');
      setValidationSuccess(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    removeUserApiKey();
    setHasExistingKey(false);
    setApiKey('');
    setValidationError(null);
    setValidationSuccess(false);
    onApiKeyUpdated?.();
    onClose();
  };

  if (!isOpen) return null;

  const existingKeyDisplay = hasExistingKey ? getApiKeyDisplayFormat() : null;
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
                Manage AI API Key
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
            <div className="flex items-start gap-3 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-blue-200 text-sm space-y-2">
                <p><strong>Get your API key:</strong></p>
                <p>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Google AI Studio</a> to create a free API key.</p>
                <p className="text-xs text-blue-300">
                  <strong>Privacy:</strong> Your API key is stored securely on your device and never shared.
                </p>
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
    </div>
  );
};

export default ApiKeyManagementModal;
