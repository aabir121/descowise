// @ts-nocheck
import React from 'react';
import { 
  LoadingStateType, 
  LoadingStateOptions, 
  LOADING_CLASSES, 
  getLoadingMessage 
} from '../../utils/loadingStates';

interface StandardizedLoadingProps {
  type: LoadingStateType;
  sectionId?: string;
  message?: string;
  height?: string;
  showControls?: boolean;
  showHeader?: boolean;
  t: (key: string) => string;
  className?: string;
  preserveHeight?: boolean;
}

/**
 * Standardized loading component for consistent UX across all sections
 */
const StandardizedLoading: React.FC<StandardizedLoadingProps> = ({
  type,
  sectionId = 'default',
  message,
  height = 'h-64',
  showControls = false,
  showHeader = true,
  t,
  className = '',
  preserveHeight = true
}) => {
  const loadingMessage = message || getLoadingMessage(sectionId, t);

  // Skeleton loading state
  if (type === 'skeleton') {
    return (
      <div className={`bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        {/* Header skeleton */}
        {showHeader && (
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-5 h-5 ${LOADING_CLASSES.skeleton.base}`} />
              <div className={`${LOADING_CLASSES.skeleton.title} ${LOADING_CLASSES.skeleton.base}`} />
              <div className={`w-4 h-4 ${LOADING_CLASSES.skeleton.base}`} />
            </div>
          </div>
        )}
        
        <div className="p-4 sm:p-6">
          {/* Controls skeleton */}
          {showControls && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div 
                  key={index}
                  className={`${LOADING_CLASSES.skeleton.button} ${LOADING_CLASSES.skeleton.base}`}
                />
              ))}
            </div>
          )}
          
          {/* Main content skeleton */}
          <div className={`${height} ${LOADING_CLASSES.skeleton.base} w-full`} />
          
          {/* Additional skeleton elements for complex sections */}
          {(sectionId === 'ai-insights' || sectionId === 'account-balance') && (
            <div className="mt-4 space-y-3">
              <div className={`${LOADING_CLASSES.skeleton.text} w-3/4 ${LOADING_CLASSES.skeleton.base}`} />
              <div className={`${LOADING_CLASSES.skeleton.text} w-1/2 ${LOADING_CLASSES.skeleton.base}`} />
              <div className={`${LOADING_CLASSES.skeleton.text} w-2/3 ${LOADING_CLASSES.skeleton.base}`} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Spinner loading state
  if (type === 'spinner') {
    return (
      <div className={`bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-5 h-5 ${LOADING_CLASSES.skeleton.base}`} />
              <div className={`${LOADING_CLASSES.skeleton.title} ${LOADING_CLASSES.skeleton.base}`} />
            </div>
          </div>
        )}
        
        <div className={`${LOADING_CLASSES.spinner.container} ${preserveHeight ? height : 'py-8'}`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`w-8 h-8 ${LOADING_CLASSES.spinner.spinner}`} />
            <p className={LOADING_CLASSES.spinner.text}>{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Progressive loading state (for AI insights)
  if (type === 'progressive') {
    return (
      <div className={`bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-5 h-5 bg-purple-500 rounded animate-pulse" />
              <h3 className="text-lg font-semibold text-slate-100">{t('aiInsights')}</h3>
              <div className="w-4 h-4 bg-purple-500 rounded animate-pulse" />
            </div>
          </div>
        )}
        
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3 text-purple-400">
            <div className={`w-6 h-6 ${LOADING_CLASSES.spinner.spinner} border-purple-400`} />
            <div className="flex-1">
              <p className="font-medium mb-1">{t('aiAnalysisGenerating')}</p>
              <p className="text-sm text-purple-300">{t('aiAnalysisMayTakeTime')}</p>
              <p className="text-xs text-purple-400 mt-1">{t('aiAnalysisUsuallyTakes')}</p>
            </div>
          </div>
          
          {/* Progressive content placeholders */}
          <div className="mt-6 space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-purple-500 rounded animate-pulse" />
                <div className="h-4 bg-purple-500 rounded w-24 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-purple-500/30 rounded w-full animate-pulse" />
                <div className="h-3 bg-purple-500/30 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-purple-500/30 rounded w-5/6 animate-pulse" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-slate-700/30 rounded-lg p-3">
                  <div className="h-3 bg-slate-600 rounded w-2/3 mb-2 animate-pulse" />
                  <div className="h-2 bg-slate-600 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fade loading state (minimal)
  return (
    <div className={`${LOADING_CLASSES.transition.fade} opacity-50 ${className}`}>
      <div className={`${preserveHeight ? height : 'h-32'} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 ${LOADING_CLASSES.spinner.spinner}`} />
          <span className={LOADING_CLASSES.spinner.text}>{loadingMessage}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Wrapper component for smooth loading transitions
 */
export const LoadingTransition: React.FC<{
  isLoading: boolean;
  loadingComponent: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, loadingComponent, children, className = '' }) => (
  <div className={`${LOADING_CLASSES.transition.fade} ${className}`}>
    {isLoading ? loadingComponent : children}
  </div>
);

/**
 * Staggered loading container for multiple sections
 */
export const StaggeredLoadingContainer: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}> = ({ children, staggerDelay = 100, className = '' }) => {
  const [visibleCount, setVisibleCount] = React.useState(0);
  const childrenArray = React.Children.toArray(children);

  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    childrenArray.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.max(prev, index + 1));
      }, index * staggerDelay);
      
      timers.push(timer);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [childrenArray.length, staggerDelay]);

  return (
    <div className={`space-y-6 ${className}`}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={`${LOADING_CLASSES.transition.slideUp} ${
            index < visibleCount 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${index * 50}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default StandardizedLoading;
