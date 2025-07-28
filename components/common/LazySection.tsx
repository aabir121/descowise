import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks/usePerformanceOptimization';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  minHeight?: string;
}

/**
 * LazySection component that only renders its children when they come into view
 * This helps reduce initial DOM complexity and improves performance
 */
const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  className = '',
  minHeight = '200px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [rootMargin, threshold]);

  // Default fallback component
  const defaultFallback = (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ minHeight }}
    >
      <div className="text-center">
        <div className="animate-pulse bg-slate-700 rounded-lg h-32 w-full mb-4"></div>
        <div className="text-slate-400 text-sm">Loading section...</div>
      </div>
    </div>
  );

  return (
    <div ref={elementRef} className={className} style={{ minHeight }}>
      {hasBeenVisible ? children : (fallback || defaultFallback)}
    </div>
  );
};

export default LazySection;
