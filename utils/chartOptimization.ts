/**
 * Chart optimization utilities to reduce DOM complexity and improve performance
 */

export interface DataPoint {
  [key: string]: any;
}

/**
 * Sample data points to reduce chart complexity while maintaining visual fidelity
 * Uses a combination of time-based sampling and value-based importance
 */
export function sampleChartData<T extends DataPoint>(
  data: T[],
  maxPoints: number = 50,
  keyField: string = 'name'
): T[] {
  if (!data || data.length <= maxPoints) {
    return data;
  }

  // For very large datasets, use intelligent sampling
  if (data.length > maxPoints * 3) {
    return intelligentSample(data, maxPoints, keyField);
  }

  // For moderately large datasets, use uniform sampling
  return uniformSample(data, maxPoints);
}

/**
 * Uniform sampling - takes every nth element
 */
function uniformSample<T>(data: T[], maxPoints: number): T[] {
  const step = Math.ceil(data.length / maxPoints);
  const sampled: T[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  // Always include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  
  return sampled;
}

/**
 * Intelligent sampling - preserves important data points (peaks, valleys, trends)
 */
function intelligentSample<T extends DataPoint>(
  data: T[],
  maxPoints: number,
  keyField: string
): T[] {
  if (data.length <= maxPoints) return data;

  const sampled: T[] = [];
  const step = Math.ceil(data.length / maxPoints);
  
  // Always include first and last points
  sampled.push(data[0]);
  
  // Find numeric fields for trend analysis
  const numericFields = Object.keys(data[0]).filter(key => 
    key !== keyField && typeof data[0][key] === 'number'
  );
  
  for (let i = step; i < data.length - step; i += step) {
    let shouldInclude = false;
    
    // Check if this point represents a significant change
    for (const field of numericFields) {
      const prev = data[i - step][field] as number;
      const curr = data[i][field] as number;
      const next = data[i + step] ? data[i + step][field] as number : curr;
      
      // Include if it's a local extremum or significant change
      if (isLocalExtremum(prev, curr, next) || isSignificantChange(prev, curr, next)) {
        shouldInclude = true;
        break;
      }
    }
    
    if (shouldInclude) {
      sampled.push(data[i]);
    }
  }
  
  // Always include the last point
  sampled.push(data[data.length - 1]);
  
  // If we still have too many points, fall back to uniform sampling
  if (sampled.length > maxPoints) {
    return uniformSample(sampled, maxPoints);
  }
  
  return sampled;
}

/**
 * Check if a point is a local extremum (peak or valley)
 */
function isLocalExtremum(prev: number, curr: number, next: number): boolean {
  return (curr > prev && curr > next) || (curr < prev && curr < next);
}

/**
 * Check if there's a significant change in trend
 */
function isSignificantChange(prev: number, curr: number, next: number): boolean {
  const threshold = 0.1; // 10% change threshold
  const change1 = Math.abs((curr - prev) / prev);
  const change2 = Math.abs((next - curr) / curr);
  return change1 > threshold || change2 > threshold;
}

/**
 * Optimize chart data based on chart type and viewport
 */
export function optimizeChartData<T extends DataPoint>(
  data: T[],
  chartType: 'line' | 'bar' | 'area' | 'pie',
  options: {
    maxPoints?: number;
    keyField?: string;
    preserveExtremes?: boolean;
  } = {}
): T[] {
  const {
    maxPoints = getDefaultMaxPoints(chartType),
    keyField = 'name',
    preserveExtremes = true
  } = options;

  if (!data || data.length === 0) return data;

  // For pie charts, limit to top N slices and group others
  if (chartType === 'pie') {
    return optimizePieData(data, maxPoints);
  }

  // For other chart types, use sampling
  let optimized = sampleChartData(data, maxPoints, keyField);

  // Preserve extreme values if requested
  if (preserveExtremes && chartType !== 'bar') {
    optimized = preserveExtremeValues(data, optimized);
  }

  return optimized;
}

/**
 * Get default maximum points based on chart type
 */
function getDefaultMaxPoints(chartType: string): number {
  switch (chartType) {
    case 'line':
    case 'area':
      return 50;
    case 'bar':
      return 30;
    case 'pie':
      return 8;
    default:
      return 40;
  }
}

/**
 * Optimize pie chart data by grouping small slices
 */
function optimizePieData<T extends DataPoint>(data: T[], maxSlices: number): T[] {
  if (data.length <= maxSlices) return data;

  // Sort by value (assuming 'value' field exists)
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
  
  // Take top slices
  const topSlices = sorted.slice(0, maxSlices - 1);
  
  // Group remaining slices into "Others"
  const remainingSlices = sorted.slice(maxSlices - 1);
  const othersValue = remainingSlices.reduce((sum, item) => sum + (item.value || 0), 0);
  
  if (othersValue > 0) {
    topSlices.push({
      ...remainingSlices[0], // Use first remaining item as template
      name: 'Others',
      value: othersValue
    } as T);
  }
  
  return topSlices;
}

/**
 * Preserve extreme values in the optimized dataset
 */
function preserveExtremeValues<T extends DataPoint>(original: T[], optimized: T[]): T[] {
  const numericFields = Object.keys(original[0]).filter(key => 
    typeof original[0][key] === 'number'
  );

  const extremes: T[] = [];
  
  for (const field of numericFields) {
    const values = original.map(item => item[field] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Find items with extreme values
    const minItem = original.find(item => item[field] === min);
    const maxItem = original.find(item => item[field] === max);
    
    if (minItem && !optimized.includes(minItem)) extremes.push(minItem);
    if (maxItem && !optimized.includes(maxItem)) extremes.push(maxItem);
  }
  
  // Merge extremes with optimized data and sort by original order
  const combined = [...optimized, ...extremes];
  const originalIndices = new Map(original.map((item, index) => [item, index]));
  
  return combined.sort((a, b) => 
    (originalIndices.get(a) || 0) - (originalIndices.get(b) || 0)
  );
}

/**
 * Debounce chart updates to prevent excessive re-renders
 */
export function debounceChartUpdate<T extends any[]>(
  callback: (...args: T) => void,
  delay: number = 300
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

/**
 * Memoize chart configurations to prevent recreation
 */
export function createChartConfig<T>(
  configFactory: () => T,
  dependencies: any[]
): T {
  // This would typically use React.useMemo in a component
  // Here we provide the factory function for use with useMemo
  return configFactory();
}
