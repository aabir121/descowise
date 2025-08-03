import React, { useState } from 'react';
import { InformationCircleIcon } from './Icons';

interface AiInsightTooltipProps {
  insightType: 'balance' | 'consumption' | 'recharge' | 'anomaly' | 'forecast' | 'seasonal' | 'optimization';
  t: (key: string) => string;
  className?: string;
}

const AiInsightTooltip: React.FC<AiInsightTooltipProps> = ({ insightType, t, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipContent = () => {
    switch (insightType) {
      case 'balance':
        return {
          title: t('balanceInsightTitle', 'Balance Monitoring'),
          description: t('balanceInsightDesc', 'AI analyzes your balance patterns to predict when you\'ll need to recharge.'),
          example: t('balanceInsightExample', 'Example: "Your balance typically lasts 12 days. Recharge by March 15th to avoid disconnection."'),
          benefit: t('balanceInsightBenefit', 'Never run out of electricity unexpectedly')
        };
      
      case 'consumption':
        return {
          title: t('consumptionInsightTitle', 'Usage Analysis'),
          description: t('consumptionInsightDesc', 'AI identifies your consumption patterns and suggests ways to reduce your electricity bill.'),
          example: t('consumptionInsightExample', 'Example: "You use 15% more electricity on weekends. Consider using AC less during peak hours to save ৳300/month."'),
          benefit: t('consumptionInsightBenefit', 'Reduce your monthly electricity bill by 10-20%')
        };
      
      case 'recharge':
        return {
          title: t('rechargeInsightTitle', 'Recharge Optimization'),
          description: t('rechargeInsightDesc', 'AI learns your recharge habits and suggests optimal timing and amounts.'),
          example: t('rechargeInsightExample', 'Example: "Recharge ৳1000 every 2 weeks instead of ৳500 weekly to get better unit rates."'),
          benefit: t('rechargeInsightBenefit', 'Optimize recharge timing and amounts for better value')
        };
      
      case 'anomaly':
        return {
          title: t('anomalyInsightTitle', 'Unusual Usage Detection'),
          description: t('anomalyInsightDesc', 'AI detects when your electricity usage is unusually high or low.'),
          example: t('anomalyInsightExample', 'Example: "Your usage increased 40% this week. Check if AC is running efficiently or if there\'s a faulty appliance."'),
          benefit: t('anomalyInsightBenefit', 'Catch problems early before they affect your bill')
        };
      
      case 'forecast':
        return {
          title: t('forecastInsightTitle', 'Bill Prediction'),
          description: t('forecastInsightDesc', 'AI predicts your future electricity bills based on current usage patterns.'),
          example: t('forecastInsightExample', 'Example: "Based on current usage, your March bill will be approximately ৳2,500. Budget accordingly."'),
          benefit: t('forecastInsightBenefit', 'Plan your budget and avoid bill surprises')
        };
      
      case 'seasonal':
        return {
          title: t('seasonalInsightTitle', 'Seasonal Patterns'),
          description: t('seasonalInsightDesc', 'AI identifies how your usage changes with weather and seasons.'),
          example: t('seasonalInsightExample', 'Example: "Your summer bills are 60% higher due to AC usage. Consider using fans during mild weather."'),
          benefit: t('seasonalInsightBenefit', 'Prepare for seasonal bill changes and adjust usage')
        };
      
      case 'optimization':
        return {
          title: t('optimizationInsightTitle', 'Smart Recommendations'),
          description: t('optimizationInsightDesc', 'AI provides personalized tips to reduce your electricity consumption and costs.'),
          example: t('optimizationInsightExample', 'Example: "Shift heavy appliance usage to off-peak hours (10 PM - 6 AM) to save ৳400/month."'),
          benefit: t('optimizationInsightBenefit', 'Get personalized tips to save money on electricity')
        };
      
      default:
        return {
          title: t('aiInsightTitle', 'AI Insight'),
          description: t('aiInsightDesc', 'AI-powered analysis of your electricity usage patterns.'),
          example: t('aiInsightExample', 'Get personalized recommendations based on your usage data.'),
          benefit: t('aiInsightBenefit', 'Make smarter decisions about your electricity usage')
        };
    }
  };

  const content = getTooltipContent();

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-slate-400 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded"
        aria-label={`Information about ${content.title}`}
      >
        <InformationCircleIcon className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-slate-800 border border-slate-600 rounded-lg shadow-xl -top-2 left-6 transform">
          {/* Arrow */}
          <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-slate-800"></div>
          
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
      )}
    </div>
  );
};

export default AiInsightTooltip;
