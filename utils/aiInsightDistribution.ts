// @ts-nocheck
import { AiSummary } from '../types';

// Define the structure for distributed AI insights using Hybrid Smart Approach
export interface DistributedAiInsights {
  // Main AI Section: High-level summary and critical insights
  main: {
    title?: string;
    overallSummary?: string;
    criticalAnomalies?: AiSummary['anomaly']; // Only if critical/urgent
    generalActionableTip?: string; // Cross-cutting recommendations
  };
  // Panel-specific insights: Detailed, actionable information
  balance: {
    balanceStatusAndAdvice?: AiSummary['balanceStatusAndAdvice'];
    balanceDepletionForecast?: AiSummary['balanceDepletionForecast'];
    rechargeRecommendation?: AiSummary['rechargeRecommendation'];
    rechargeTimingInsight?: string;
  };
  consumption: {
    seasonalTrend?: AiSummary['seasonalTrend'];
    currentMonthBillForecast?: AiSummary['currentMonthBillForecast'];
    futureConsumptionForecast?: AiSummary['futureConsumptionForecast'];
    minorAnomalies?: AiSummary['anomaly']; // Non-critical anomalies
  };
  recharge: {
    rechargePatternInsight?: string;
    rechargeSpecificTips?: string; // Only recharge-specific tips
  };
}

// Define loading states for each section
export interface AiLoadingStates {
  main: boolean; // Main AI section
  balance: boolean;
  consumption: boolean;
  recharge: boolean;
  global: boolean; // Overall AI loading state
}

// Function to distribute AI summary data using Hybrid Smart Approach
export function distributeAiInsights(aiSummary: AiSummary | null): DistributedAiInsights {
  if (!aiSummary) {
    return {
      main: {},
      balance: {},
      consumption: {},
      recharge: {}
    };
  }

  // Smart logic to determine content distribution
  const isRechargeRelatedTip = aiSummary.actionableTip &&
    (aiSummary.actionableTip.toLowerCase().includes('recharge') ||
     aiSummary.actionableTip.toLowerCase().includes('top up') ||
     aiSummary.actionableTip.toLowerCase().includes('payment'));

  // Determine if anomaly is critical (affects multiple areas or urgent)
  const isCriticalAnomaly = aiSummary.anomaly?.detected &&
    (aiSummary.anomaly.details.toLowerCase().includes('urgent') ||
     aiSummary.anomaly.details.toLowerCase().includes('critical') ||
     aiSummary.anomaly.details.toLowerCase().includes('immediate') ||
     aiSummary.anomaly.details.toLowerCase().includes('significant'));

  return {
    // Main Section: High-level summary and critical insights
    main: {
      title: aiSummary.title,
      overallSummary: aiSummary.overallSummary,
      criticalAnomalies: isCriticalAnomaly ? aiSummary.anomaly : undefined,
      generalActionableTip: !isRechargeRelatedTip ? aiSummary.actionableTip : undefined
    },

    // Balance Panel: Specific balance and recharge insights
    balance: {
      balanceStatusAndAdvice: aiSummary.balanceStatusAndAdvice,
      balanceDepletionForecast: aiSummary.balanceDepletionForecast,
      rechargeRecommendation: aiSummary.rechargeRecommendation,
      rechargeTimingInsight: aiSummary.rechargeTimingInsight
    },

    // Consumption Panel: Usage patterns and forecasts
    consumption: {
      seasonalTrend: aiSummary.seasonalTrend,
      currentMonthBillForecast: aiSummary.currentMonthBillForecast,
      futureConsumptionForecast: aiSummary.futureConsumptionForecast,
      minorAnomalies: !isCriticalAnomaly && aiSummary.anomaly?.detected ? aiSummary.anomaly : undefined
    },

    // Recharge Panel: Recharge patterns and specific tips
    recharge: {
      rechargePatternInsight: aiSummary.rechargePatternInsight,
      rechargeSpecificTips: isRechargeRelatedTip ? aiSummary.actionableTip : undefined
    }
  };
}

// Function to check if a panel has any AI insights
export function hasAiInsights(insights: any): boolean {
  if (!insights) return false;
  return Object.values(insights).some(value => 
    value !== undefined && value !== null && value !== ''
  );
}

// Function to get loading text for each section
export function getAiLoadingText(sectionType: keyof DistributedAiInsights, t: (key: string) => string): string {
  switch (sectionType) {
    case 'main':
      return t('generatingInsights');
    case 'balance':
      return t('analyzingBalance');
    case 'consumption':
      return t('analyzingUsage');
    case 'recharge':
      return t('analyzingRecharges');
    default:
      return t('analyzing');
  }
}

// Function to create initial loading states
export function createInitialLoadingStates(): AiLoadingStates {
  return {
    main: false,
    balance: false,
    consumption: false,
    recharge: false,
    global: false
  };
}

// Function to update loading states when AI analysis starts
export function startAiAnalysis(): AiLoadingStates {
  return {
    main: true,
    balance: true,
    consumption: true,
    recharge: true,
    global: true
  };
}

// Function to update loading states when AI analysis completes
export function completeAiAnalysis(): AiLoadingStates {
  return {
    main: false,
    balance: false,
    consumption: false,
    recharge: false,
    global: false
  };
}

// Function to update loading states when AI analysis fails
export function failAiAnalysis(): AiLoadingStates {
  return completeAiAnalysis();
}
