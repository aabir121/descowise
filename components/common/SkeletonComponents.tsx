// @ts-nocheck
import React from 'react';

/**
 * Base skeleton component with consistent styling
 */
const SkeletonBase: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

/**
 * Skeleton for text content
 */
export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
  widths?: string[];
}> = ({ 
  lines = 1, 
  className = '', 
  widths = ['w-full'] 
}) => (
  <SkeletonBase className={className}>
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className={`h-4 bg-slate-700 rounded mb-2 last:mb-0 ${
          widths[index] || widths[widths.length - 1] || 'w-full'
        }`}
      />
    ))}
  </SkeletonBase>
);

/**
 * Skeleton for dashboard section headers
 */
export const SkeletonSectionHeader: React.FC<{ showInfoIcon?: boolean }> = ({ 
  showInfoIcon = false 
}) => (
  <div className="flex items-center justify-between p-3 sm:p-4">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
      <div className="h-5 bg-slate-700 rounded w-32 animate-pulse" />
      {showInfoIcon && (
        <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
      )}
    </div>
  </div>
);

/**
 * Skeleton for account balance section
 */
export const SkeletonAccountBalance: React.FC = () => (
  <div className="bg-slate-800 rounded-xl overflow-hidden">
    <SkeletonSectionHeader showInfoIcon={true} />
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance gauge skeleton */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-700/50 rounded-xl">
          <SkeletonBase>
            <div className="w-32 h-32 bg-slate-700 rounded-full mb-4" />
            <div className="h-6 bg-slate-700 rounded w-24 mx-auto mb-2" />
            <div className="h-4 bg-slate-700 rounded w-16 mx-auto" />
          </SkeletonBase>
        </div>
        
        {/* Balance details skeleton */}
        <div className="space-y-4">
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <SkeletonText lines={1} widths={['w-20']} className="mb-2" />
            <SkeletonText lines={1} widths={['w-32']} />
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <SkeletonText lines={1} widths={['w-24']} className="mb-2" />
            <SkeletonText lines={1} widths={['w-28']} />
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <SkeletonText lines={1} widths={['w-16']} className="mb-2" />
            <div className="h-6 bg-slate-700 rounded-full w-20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for chart sections
 */
export const SkeletonChart: React.FC<{ 
  title?: string;
  showControls?: boolean;
  height?: string;
}> = ({ 
  showControls = false,
  height = 'h-64'
}) => (
  <div className="bg-slate-800 rounded-xl overflow-hidden">
    <SkeletonSectionHeader showInfoIcon={true} />
    <div className="p-4 sm:p-6">
      {/* Chart controls skeleton */}
      {showControls && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div 
              key={index}
              className="h-8 bg-slate-700 rounded w-20 animate-pulse"
            />
          ))}
        </div>
      )}
      
      {/* Chart area skeleton */}
      <SkeletonBase>
        <div className={`bg-slate-700 rounded ${height} w-full`} />
      </SkeletonBase>
      
      {/* Chart legend skeleton */}
      <div className="flex justify-center gap-4 mt-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 bg-slate-700 rounded w-12 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton for table sections
 */
export const SkeletonTable: React.FC<{ 
  rows?: number;
  columns?: number;
}> = ({ 
  rows = 5,
  columns = 4
}) => (
  <div className="bg-slate-800 rounded-xl overflow-hidden">
    <SkeletonSectionHeader showInfoIcon={true} />
    <div className="p-4 sm:p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          {/* Table header skeleton */}
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <div className="h-4 bg-slate-700 rounded w-16 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          {/* Table body skeleton */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-700">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 bg-slate-700 rounded w-full animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for consumer information section
 */
export const SkeletonConsumerInfo: React.FC = () => (
  <div className="bg-slate-800 rounded-xl overflow-hidden">
    <SkeletonSectionHeader showInfoIcon={true} />
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-slate-700/30 p-4 rounded-lg">
            <SkeletonText lines={1} widths={['w-20']} className="mb-2" />
            <SkeletonText lines={1} widths={['w-32']} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton for AI insights section
 */
export const SkeletonAIInsights: React.FC = () => (
  <div className="bg-slate-800 rounded-xl overflow-hidden">
    <SkeletonSectionHeader showInfoIcon={true} />
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* AI overview skeleton */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 bg-slate-700 rounded w-24 animate-pulse" />
          </div>
          <SkeletonText lines={3} widths={['w-full', 'w-3/4', 'w-5/6']} />
        </div>

        {/* AI recommendations skeleton */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 bg-slate-700 rounded w-32 animate-pulse" />
          </div>
          <SkeletonText lines={2} widths={['w-full', 'w-4/5']} />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Comprehensive dashboard skeleton that shows all sections
 */
export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* AI Insights skeleton */}
    <SkeletonAIInsights />

    {/* Consumer Information skeleton */}
    <SkeletonConsumerInfo />

    {/* Account Balance skeleton */}
    <SkeletonAccountBalance />

    {/* Consumption Chart skeleton */}
    <SkeletonChart showControls={true} height="h-64" />

    {/* Recharge History skeleton */}
    <SkeletonTable rows={5} columns={4} />

    {/* Additional chart sections */}
    <SkeletonChart showControls={true} height="h-64" />
    <SkeletonChart showControls={false} height="h-48" />
    <SkeletonChart showControls={false} height="h-56" />
  </div>
);

/**
 * Loading state wrapper that provides smooth transitions
 */
export const LoadingStateWrapper: React.FC<{
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, skeleton, children, className = '' }) => (
  <div className={`transition-all duration-300 ease-in-out ${className}`}>
    {isLoading ? skeleton : children}
  </div>
);

/**
 * Smooth fade transition component
 */
export const FadeTransition: React.FC<{
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: string;
}> = ({ show, children, className = '', duration = 'duration-300' }) => (
  <div
    className={`transition-opacity ${duration} ease-in-out ${
      show ? 'opacity-100' : 'opacity-0'
    } ${className}`}
  >
    {children}
  </div>
);

/**
 * Slide and fade transition component
 */
export const SlideUpTransition: React.FC<{
  show: boolean;
  children: React.ReactNode;
  className?: string;
  delay?: string;
}> = ({ show, children, className = '', delay = '' }) => (
  <div
    className={`transition-all duration-300 ease-in-out transform ${delay} ${
      show
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-2'
    } ${className}`}
  >
    {children}
  </div>
);
