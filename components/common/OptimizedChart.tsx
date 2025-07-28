import React, { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer } from 'recharts';
import { optimizeChartData } from '../../utils/chartOptimization';
import ErrorBoundary from './ErrorBoundary';

interface OptimizedChartProps {
  data: any[];
  chartType: 'line' | 'bar' | 'area' | 'pie';
  children: (data: any[]) => React.ReactNode;
  maxDataPoints?: number;
  height?: number | string;
  width?: number | string;
  className?: string;
  enableLazyLoading?: boolean;
  enableDataSampling?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * High-performance chart wrapper that implements various optimizations:
 * - Data sampling to reduce DOM complexity
 * - Lazy loading with intersection observer
 * - Error boundaries for chart failures
 * - Memoization to prevent unnecessary re-renders
 * - Responsive container optimization
 */
const OptimizedChart: React.FC<OptimizedChartProps> = memo(({
  data,
  chartType,
  children,
  maxDataPoints = 50,
  height = 300,
  width = '100%',
  className = '',
  enableLazyLoading = true,
  enableDataSampling = true,
  loadingComponent,
  errorComponent,
  onError
}) => {
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [enableLazyLoading, isVisible]);

  // Optimize chart data
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    try {
      if (enableDataSampling) {
        return optimizeChartData(data, chartType, {
          maxPoints: maxDataPoints,
          preserveExtremes: true
        });
      }
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Chart data optimization failed');
      setError(error);
      setHasError(true);
      onError?.(error);
      return data; // Fallback to original data
    }
  }, [data, chartType, maxDataPoints, enableDataSampling, onError]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.filename?.includes('recharts') || event.message?.includes('chart')) {
        setHasError(true);
        setError(new Error(event.message));
        onError?.(new Error(event.message));
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  // Reset error state when data changes
  useEffect(() => {
    setHasError(false);
    setError(null);
  }, [data]);

  // Render error state
  if (hasError) {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }
    
    return (
      <div className={`flex items-center justify-center p-8 ${className}`} style={{ height }}>
        <div className="text-center text-red-400">
          <div className="text-lg font-semibold mb-2">Chart Error</div>
          <div className="text-sm text-slate-400">
            {error?.message || 'Failed to render chart'}
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
            }}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (!isVisible) {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }
    
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-pulse bg-slate-700 rounded-lg h-32 w-full mb-4"></div>
          <div className="text-slate-400 text-sm">Loading chart...</div>
        </div>
      </div>
    );
  }

  // Render chart
  return (
    <div ref={containerRef} className={className} style={{ height, width }}>
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-400">
              <div className="text-lg font-semibold mb-2">Chart Error</div>
              <div className="text-sm text-slate-400">Failed to render chart</div>
            </div>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          {children(optimizedData)}
        </ResponsiveContainer>
      </ErrorBoundary>
    </div>
  );
});

OptimizedChart.displayName = 'OptimizedChart';

export default OptimizedChart;

/**
 * Hook for chart performance monitoring
 */
export function useChartPerformance(chartName: string) {
  const renderTimeRef = useRef<number>();
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    dataPoints: 0,
    lastUpdate: Date.now()
  });

  const startRender = useCallback(() => {
    renderTimeRef.current = performance.now();
  }, []);

  const endRender = useCallback((dataPointCount: number) => {
    if (renderTimeRef.current) {
      const renderTime = performance.now() - renderTimeRef.current;
      setMetrics({
        renderTime,
        dataPoints: dataPointCount,
        lastUpdate: Date.now()
      });
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Chart [${chartName}] rendered in ${renderTime.toFixed(2)}ms with ${dataPointCount} data points`);
      }
    }
  }, [chartName]);

  return { metrics, startRender, endRender };
}

/**
 * Chart container with built-in performance optimizations
 */
export const PerformantChartContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = memo(({ children, className = '', style = {} }) => {
  return (
    <div 
      className={`chart-container ${className}`}
      style={{
        contain: 'layout style paint',
        willChange: 'transform',
        ...style
      }}
    >
      {children}
    </div>
  );
});

PerformantChartContainer.displayName = 'PerformantChartContainer';
