import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyIcon, ShieldCheckIcon, ExclamationTriangleIcon } from './Icons';
import { hasStoredApiKey, getApiKeyDisplayFormat } from '../../utils/apiKeyStorage';

export type ApiKeyStatusVariant = 'badge' | 'button' | 'inline' | 'compact';
export type ApiKeyStatusSize = 'sm' | 'md' | 'lg';

interface ApiKeyStatusIndicatorProps {
  variant?: ApiKeyStatusVariant;
  size?: ApiKeyStatusSize;
  onClick?: () => void;
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
  disabled?: boolean;
}

const ApiKeyStatusIndicator: React.FC<ApiKeyStatusIndicatorProps> = ({
  variant = 'badge',
  size = 'md',
  onClick,
  showLabel = true,
  showTooltip = true,
  className = '',
  disabled = false
}) => {
  const { t } = useTranslation();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyDisplay, setApiKeyDisplay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApiKeyStatus = async () => {
      setIsLoading(true);
      try {
        const hasKey = hasStoredApiKey();
        setHasApiKey(hasKey);
        
        if (hasKey) {
          const display = getApiKeyDisplayFormat();
          setApiKeyDisplay(display);
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

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-3 h-3 sm:w-4 sm:h-4',
          text: 'text-xs sm:text-sm',
          padding: 'px-2 py-1 sm:px-3 sm:py-1.5',
          gap: 'gap-1 sm:gap-2'
        };
      case 'lg':
        return {
          icon: 'w-5 h-5 sm:w-6 sm:h-6',
          text: 'text-sm sm:text-base',
          padding: 'px-3 py-1.5 sm:px-4 sm:py-2',
          gap: 'gap-2 sm:gap-3'
        };
      default: // md
        return {
          icon: 'w-4 h-4 sm:w-5 sm:h-5',
          text: 'text-xs sm:text-sm',
          padding: 'px-2 py-1 sm:px-3 sm:py-1.5',
          gap: 'gap-1 sm:gap-2'
        };
    }
  };

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: KeyIcon,
        bgColor: 'bg-slate-600/50',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/50',
        label: t('checking', 'Checking...'),
        tooltip: t('checkingApiKeyStatus', 'Checking API key status...')
      };
    }

    if (hasApiKey) {
      return {
        icon: ShieldCheckIcon,
        bgColor: 'bg-green-600/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/30',
        label: t('apiKeyConfigured', 'API Key Configured'),
        tooltip: `${t('apiKeyConfigured', 'API Key Configured')}: ${apiKeyDisplay}`
      };
    }

    return {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-600/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      label: t('apiKeyNotConfigured', 'API Key Not Configured'),
      tooltip: t('apiKeyNotConfiguredTooltip', 'Click to configure your Google Gemini API key for AI features')
    };
  };

  const sizeClasses = getSizeClasses();
  const statusConfig = getStatusConfig();
  const IconComponent = statusConfig.icon;

  const baseClasses = `
    inline-flex items-center ${sizeClasses.gap} 
    ${sizeClasses.text} font-medium rounded-lg 
    transition-all duration-200
    ${statusConfig.textColor}
  `.trim();

  const getVariantClasses = () => {
    switch (variant) {
      case 'button':
        return `
          ${baseClasses} ${sizeClasses.padding}
          ${statusConfig.bgColor} border ${statusConfig.borderColor}
          ${onClick && !disabled ? 'hover:bg-opacity-80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `.trim();
      
      case 'inline':
        return `
          ${baseClasses}
          ${onClick && !disabled ? 'hover:opacity-80 cursor-pointer' : ''}
        `.trim();
      
      case 'compact':
        return `
          ${baseClasses}
          ${onClick && !disabled ? 'hover:opacity-80 cursor-pointer' : ''}
        `.trim();
      
      default: // badge
        return `
          ${baseClasses} ${sizeClasses.padding}
          ${statusConfig.bgColor} border ${statusConfig.borderColor}
        `.trim();
    }
  };

  const handleClick = () => {
    if (onClick && !disabled && !isLoading) {
      onClick();
    }
  };

  const getDisplayLabel = () => {
    if (variant === 'compact') {
      return hasApiKey ? t('configured', 'Configured') : t('notConfigured', 'Not Configured');
    }
    return statusConfig.label;
  };

  if (onClick) {
    return (
      <button
        className={`${getVariantClasses()} ${className} focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
        onClick={handleClick}
        disabled={disabled || isLoading}
        title={showTooltip ? statusConfig.tooltip : undefined}
      >
        <IconComponent className={sizeClasses.icon} />
        {showLabel && (
          <span className="truncate">
            {getDisplayLabel()}
          </span>
        )}
      </button>
    );
  }

  const content = (
    <div
      className={`${getVariantClasses()} ${className}`}
      title={showTooltip ? statusConfig.tooltip : undefined}
    >
      <IconComponent className={sizeClasses.icon} />
      {showLabel && (
        <span className="truncate">
          {getDisplayLabel()}
        </span>
      )}
    </div>
  );

  return content;
};

export default ApiKeyStatusIndicator;
