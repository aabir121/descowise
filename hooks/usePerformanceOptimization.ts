import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Custom hook for performance optimizations to reduce main thread work
 */

/**
 * Debounce hook to prevent excessive function calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Throttle hook to limit function execution frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
}

/**
 * Memoize expensive calculations with deep comparison
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: any[]
): T {
  const ref = useRef<{ deps: any[]; value: T }>();
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory()
    };
  }
  
  return ref.current.value;
}

/**
 * Deep equality check for arrays and objects
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Lazy initialization hook for expensive computations
 */
export function useLazyInit<T>(initializer: () => T): T {
  const ref = useRef<T>();
  
  if (ref.current === undefined) {
    ref.current = initializer();
  }
  
  return ref.current;
}

/**
 * Batch state updates to reduce re-renders
 */
export function useBatchedUpdates() {
  const pendingUpdatesRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    pendingUpdatesRef.current.push(updateFn);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = [];
      
      // Execute all batched updates
      updates.forEach(update => update());
    }, 0);
  }, []);
  
  return batchUpdate;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const isIntersectingRef = useRef(false);
  
  const setElement = useCallback((element: HTMLElement | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
    
    elementRef.current = element;
    
    if (element) {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            isIntersectingRef.current = entry.isIntersecting;
          },
          options
        );
      }
      
      observerRef.current.observe(element);
    }
  }, [options]);
  
  const isIntersecting = () => isIntersectingRef.current;
  
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return { setElement, isIntersecting };
}

/**
 * Virtualization hook for large lists
 */
export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const scrollTop = useRef(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop.current / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop.current + containerHeight) / itemHeight)
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(itemCount - 1, endIndex + overscan)
    };
  }, [itemCount, itemHeight, containerHeight, overscan]);
  
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    scrollTop.current = event.currentTarget.scrollTop;
  }, []);
  
  return {
    visibleRange,
    onScroll,
    totalHeight: itemCount * itemHeight
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number>();
  
  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);
  
  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      startTimeRef.current = undefined;
    }
  }, [name]);
  
  const measure = useCallback(<T>(fn: () => T): T => {
    start();
    const result = fn();
    end();
    return result;
  }, [start, end]);
  
  return { start, end, measure };
}

/**
 * Memory-efficient state hook for large datasets
 */
export function useMemoryEfficientState<T>(
  initialValue: T,
  maxHistorySize: number = 10
) {
  const stateRef = useRef<T>(initialValue);
  const historyRef = useRef<T[]>([]);
  
  const setState = useCallback((newValue: T | ((prev: T) => T)) => {
    const prevValue = stateRef.current;
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(prevValue)
      : newValue;
    
    stateRef.current = nextValue;
    
    // Maintain limited history for undo functionality
    historyRef.current.push(prevValue);
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
    }
  }, [maxHistorySize]);
  
  const undo = useCallback(() => {
    const previousValue = historyRef.current.pop();
    if (previousValue !== undefined) {
      stateRef.current = previousValue;
    }
  }, []);
  
  return [stateRef.current, setState, undo] as const;
}
