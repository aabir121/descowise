import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { InformationCircleIcon } from './Icons';

interface AiInsightTooltipProps {
  insightType: 'balance' | 'consumption' | 'recharge' | 'anomaly' | 'forecast' | 'seasonal' | 'optimization';
  t: (key: string) => string;
  className?: string;
}

const TooltipPortal: React.FC<{ children: React.ReactNode; rect: DOMRect | null }> = ({ children, rect }) => {
  const tooltipRoot = document.body;
  const el = document.createElement('div');

  useEffect(() => {
    tooltipRoot.appendChild(el);
    return () => {
      tooltipRoot.removeChild(el);
    };
  }, [el, tooltipRoot]);

  if (!rect) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: rect.top + window.scrollY,
    left: rect.right + 10 + window.scrollX,
    zIndex: 1000,
  };

  return ReactDOM.createPortal(
    <div style={style}>{children}</div>,
    el
  );
};


const AiInsightTooltip: React.FC<AiInsightTooltipProps> = ({ insightType, t, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const getTooltipContent = () => {
    const contentKeys = {
      balance: {
        title: 'balanceInsightTitle',
        description: 'balanceInsightDesc',
        example: 'balanceInsightExample',
        benefit: 'balanceInsightBenefit'
      },
      consumption: {
        title: 'consumptionInsightTitle',
        description: 'consumptionInsightDesc',
        example: 'consumptionInsightExample',
        benefit: 'consumptionInsightBenefit'
      },
      recharge: {
        title: 'rechargeInsightTitle',
        description: 'rechargeInsightDesc',
        example: 'rechargeInsightExample',
        benefit: 'rechargeInsightBenefit'
      },
      anomaly: {
        title: 'anomalyInsightTitle',
        description: 'anomalyInsightDesc',
        example: 'anomalyInsightExample',
        benefit: 'anomalyInsightBenefit'
      },
      forecast: {
        title: 'forecastInsightTitle',
        description: 'forecastInsightDesc',
        example: 'forecastInsightExample',
        benefit: 'forecastInsightBenefit'
      },
      seasonal: {
        title: 'seasonalInsightTitle',
        description: 'seasonalInsightDesc',
        example: 'seasonalInsightExample',
        benefit: 'seasonalInsightBenefit'
      },
      optimization: {
        title: 'optimizationInsightTitle',
        description: 'optimizationInsightDesc',
        example: 'optimizationInsightExample',
        benefit: 'optimizationInsightBenefit'
      },
      default: {
        title: 'aiInsightTitle',
        description: 'aiInsightDesc',
        example: 'aiInsightExample',
        benefit: 'aiInsightBenefit'
      }
    };

    const keys = contentKeys[insightType] || contentKeys.default;

    return {
      title: t(keys.title),
      description: t(keys.description),
      example: t(keys.example),
      benefit: t(keys.benefit)
    };
  };

  const content = getTooltipContent();

  const handleInteraction = () => {
    if (iconRef.current) {
      setRect(iconRef.current.getBoundingClientRect());
    }
    setIsVisible(!isVisible);
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
        if (iconRef.current) {
          setRect(iconRef.current.getBoundingClientRect());
        }
        setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false);
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <button
        ref={iconRef}
        onClick={isMobile ? handleInteraction : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="text-slate-400 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded"
        aria-label={`Information about ${content.title}`}
      >
        <InformationCircleIcon className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <TooltipPortal rect={rect}>
          <div className="w-80 p-4 bg-slate-800 border border-slate-600 rounded-lg shadow-xl animate-fade-in-down">
            {/* Content */}
            <div className="space-y-3">
              <h4 className="font-semibold text-cyan-400 text-sm">{content.title}</h4>
              
              <p className="text-slate-300 text-xs leading-relaxed">
                {content.description}
              </p>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <h5 className="font-medium text-slate-200 text-xs mb-2">💡 {t('example', 'Example')}</h5>
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  {content.example}
                </p>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <h5 className="font-medium text-green-400 text-xs mb-1">✨ {t('benefit', 'Benefit')}</h5>
                <p className="text-green-300 text-xs">
                  {content.benefit}
                </p>
              </div>
            </div>
          </div>
        </TooltipPortal>
      )}
    </div>
  );
};

export default AiInsightTooltip;