/**
 * Standardized loading state management for consistent UX
 */
import React from 'react';

export interface LoadingConfig {
  /** Duration of fade transitions in milliseconds */
  transitionDuration: number;
  /** Minimum loading time to prevent flashing */
  minLoadingTime: number;
  /** Delay before showing loading state to prevent flashing for fast loads */
  loadingDelay: number;
  /** Stagger delay between sections */
  staggerDelay: number;
}

export const DEFAULT_LOADING_CONFIG: LoadingConfig = {
  transitionDuration: 300,
  minLoadingTime: 500,
  loadingDelay: 150,
  staggerDelay: 100
};

export interface SectionLoadingState {
  isLoading: boolean;
  isVisible: boolean;
  hasError: boolean;
  errorMessage?: string;
  loadingStartTime?: number;
}

export type LoadingStateType = 
  | 'skeleton'     // Skeleton placeholder
  | 'spinner'      // Spinner with text
  | 'fade'         // Simple fade transition
  | 'progressive'; // Progressive content loading

export interface LoadingStateOptions {
  type: LoadingStateType;
  message?: string;
  showProgress?: boolean;
  preserveHeight?: boolean;
  minHeight?: string;
}

/**
 * Hook for managing section loading states with consistent timing
 */
export const useSectionLoading = (
  isDataLoading: boolean,
  config: Partial<LoadingConfig> = {}
) => {
  const [loadingState, setLoadingState] = React.useState<SectionLoadingState>({
    isLoading: true,
    isVisible: false,
    hasError: false
  });

  const finalConfig = { ...DEFAULT_LOADING_CONFIG, ...config };

  React.useEffect(() => {
    if (isDataLoading) {
      // Start loading
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        isVisible: false,
        hasError: false,
        loadingStartTime: Date.now()
      }));
    } else {
      // Data loaded, check minimum loading time
      const loadingStartTime = loadingState.loadingStartTime || Date.now();
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, finalConfig.minLoadingTime - elapsedTime);

      setTimeout(() => {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          isVisible: true
        }));
      }, remainingTime);
    }
  }, [isDataLoading, finalConfig.minLoadingTime, loadingState.loadingStartTime]);

  return loadingState;
};

/**
 * Generate staggered delays for multiple sections
 */
export const generateStaggeredDelays = (
  sectionCount: number,
  baseDelay: number = DEFAULT_LOADING_CONFIG.staggerDelay
): number[] => {
  return Array.from({ length: sectionCount }, (_, index) => index * baseDelay);
};

/**
 * CSS classes for consistent loading animations
 */
export const LOADING_CLASSES = {
  skeleton: {
    base: 'animate-pulse bg-slate-700 rounded',
    text: 'h-4 bg-slate-700 rounded',
    title: 'h-6 bg-slate-700 rounded w-1/3',
    chart: 'h-64 bg-slate-700 rounded',
    card: 'h-32 bg-slate-700 rounded',
    button: 'h-8 bg-slate-700 rounded w-20'
  },
  transition: {
    fade: 'transition-opacity duration-300 ease-in-out',
    slideUp: 'transition-all duration-300 ease-out transform',
    scale: 'transition-transform duration-200 ease-out'
  },
  spinner: {
    container: 'flex items-center justify-center p-8',
    spinner: 'animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400',
    text: 'text-slate-400 text-sm'
  }
} as const;

/**
 * Standard loading messages
 */
export const LOADING_MESSAGES = {
  default: 'Loading...',
  chart: 'Loading chart data...',
  ai: 'Generating AI insights...',
  balance: 'Fetching balance information...',
  history: 'Loading transaction history...',
  analysis: 'Analyzing consumption patterns...'
} as const;

/**
 * Utility to get appropriate loading message based on section type
 */
export const getLoadingMessage = (
  sectionType: string,
  t: (key: string) => string
): string => {
  const messageMap: Record<string, string> = {
    'ai-insights': t('generatingInsights') || LOADING_MESSAGES.ai,
    'account-balance': t('loadingBalance') || LOADING_MESSAGES.balance,
    'consumption-chart': t('loadingChart') || LOADING_MESSAGES.chart,
    'recharge-history': t('loadingHistory') || LOADING_MESSAGES.history,
    'comparison-chart': t('loadingAnalysis') || LOADING_MESSAGES.analysis,
    'default': t('loading') || LOADING_MESSAGES.default
  };

  return messageMap[sectionType] || messageMap.default;
};

/**
 * Performance optimization: Debounced loading state
 */
export const useDebouncedLoading = (
  isLoading: boolean,
  delay: number = DEFAULT_LOADING_CONFIG.loadingDelay
) => {
  const [debouncedLoading, setDebouncedLoading] = React.useState(isLoading);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLoading(isLoading);
    }, isLoading ? delay : 0);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return debouncedLoading;
};

/**
 * Loading state priorities for different section types
 */
export const LOADING_PRIORITIES = {
  CRITICAL: 0,    // Balance, AI insights
  HIGH: 1,        // Consumption chart, recharge history
  MEDIUM: 2,      // Comparison charts, analysis
  LOW: 3          // Historical data, advanced analytics
} as const;

/**
 * Get loading priority for a section
 */
export const getLoadingPriority = (sectionId: string): number => {
  const priorityMap: Record<string, number> = {
    'account-balance': LOADING_PRIORITIES.CRITICAL,
    'ai-insights': LOADING_PRIORITIES.CRITICAL,
    'consumption-chart': LOADING_PRIORITIES.HIGH,
    'recharge-history': LOADING_PRIORITIES.HIGH,
    'consumer-info': LOADING_PRIORITIES.HIGH,
    'comparison-chart': LOADING_PRIORITIES.MEDIUM,
    'recharge-vs-consumption': LOADING_PRIORITIES.MEDIUM,
    'max-demand': LOADING_PRIORITIES.LOW,
    'cumulative-consumption': LOADING_PRIORITIES.LOW,
    'box-plot': LOADING_PRIORITIES.LOW,
    'monthly-cost-trend': LOADING_PRIORITIES.LOW,
    'recharge-distribution': LOADING_PRIORITIES.LOW
  };

  return priorityMap[sectionId] || LOADING_PRIORITIES.MEDIUM;
};

/**
 * Calculate staggered loading delays based on priority
 */
export const calculateLoadingDelay = (
  sectionId: string,
  index: number,
  config: Partial<LoadingConfig> = {}
): number => {
  const finalConfig = { ...DEFAULT_LOADING_CONFIG, ...config };
  const priority = getLoadingPriority(sectionId);
  
  // Higher priority sections load first
  const priorityDelay = priority * 50;
  const staggerDelay = index * finalConfig.staggerDelay;
  
  return priorityDelay + staggerDelay;
};
