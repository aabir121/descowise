/**
 * Mobile-first chart configuration utilities
 * Provides consistent mobile-optimized settings across all chart components
 */

export interface MobileChartConfig {
  height: number;
  margin: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
  fontSize: number;
  dotRadius: number;
  strokeWidth: number;
  legendStyle: {
    color: string;
    paddingTop: string;
    fontSize: number;
  };
  buttonStyle: {
    minHeight: string;
    minWidth: string;
    padding: string;
  };
}

/**
 * Detect if current viewport is mobile
 */
export const isMobileViewport = (): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

/**
 * Get mobile-optimized chart configuration
 */
export const getMobileChartConfig = (chartType: 'line' | 'bar' | 'area' = 'line'): MobileChartConfig => {
  const isMobile = isMobileViewport();
  
  return {
    height: isMobile ? 280 : 320,
    margin: {
      top: 10,
      right: isMobile ? 10 : 20,
      left: isMobile ? 5 : -10, // Positive margin for mobile to prevent cramping
      bottom: isMobile ? 30 : 5  // More space for mobile legends and labels
    },
    fontSize: isMobile ? 14 : 12,
    dotRadius: isMobile ? 6 : 4, // Larger touch targets on mobile
    strokeWidth: isMobile ? 3 : 2,
    legendStyle: {
      color: '#e5e7eb',
      paddingTop: isMobile ? '25px' : '20px',
      fontSize: isMobile ? 14 : 12
    },
    buttonStyle: {
      minHeight: '44px', // WCAG minimum touch target
      minWidth: isMobile ? 'auto' : '80px',
      padding: isMobile ? 'px-6 py-3' : 'px-4 py-2'
    }
  };
};

/**
 * Get responsive chart container styles
 */
export const getChartContainerStyles = (customHeight?: number) => {
  const config = getMobileChartConfig();
  const isMobile = isMobileViewport();
  
  return {
    className: `w-full ${isMobile ? 'px-2' : 'px-0'}`,
    style: {
      height: customHeight || config.height
    }
  };
};

/**
 * Get mobile-optimized axis configuration for Recharts
 */
export const getMobileAxisConfig = () => {
  const config = getMobileChartConfig();
  const isMobile = isMobileViewport();
  
  return {
    xAxis: {
      tick: { fill: '#9ca3af', fontSize: config.fontSize },
      stroke: '#4b5563',
      fontSize: config.fontSize,
      height: isMobile ? 50 : 30 // More space for mobile labels
    },
    yAxis: {
      tick: { fontSize: config.fontSize },
      stroke: '#4b5563',
      label: {
        angle: -90,
        position: 'insideLeft' as const,
        dx: isMobile ? 0 : -10, // Better positioning for mobile
        fontSize: config.fontSize
      }
    }
  };
};

/**
 * Get mobile-optimized button classes for chart controls
 */
export const getMobileButtonClasses = (isActive: boolean, isFirst?: boolean, isLast?: boolean) => {
  const isMobile = isMobileViewport();
  
  const baseClasses = `
    ${isMobile ? 'flex-1 px-6 py-3' : 'px-4 py-2'} 
    text-sm sm:text-base font-semibold transition-colors 
    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:z-10
  `;
  
  const stateClasses = isActive 
    ? 'bg-cyan-600 text-white shadow-sm' 
    : 'text-slate-300 hover:bg-slate-600';
    
  const positionClasses = `
    ${isFirst ? 'rounded-l-lg' : ''}
    ${isLast ? 'rounded-r-lg' : ''}
  `;
  
  return `${baseClasses} ${stateClasses} ${positionClasses}`.trim();
};

/**
 * Get mobile-optimized button styles for chart controls
 */
export const getMobileButtonStyles = () => {
  const config = getMobileChartConfig();
  return {
    minHeight: config.buttonStyle.minHeight,
    minWidth: config.buttonStyle.minWidth
  };
};
