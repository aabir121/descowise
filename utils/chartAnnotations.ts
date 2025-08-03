/**
 * Chart annotation utilities for detecting and displaying significant changes
 */

export interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface Annotation {
  dataKey: string;
  value: number;
  label: string;
  type: 'increase' | 'decrease' | 'peak' | 'low' | 'anomaly';
  color: string;
  position: 'top' | 'bottom';
  significance: number; // 0-1 scale
}

/**
 * Detect significant changes in data points
 */
export const detectSignificantChanges = (
  data: DataPoint[],
  dataKey: string,
  options: {
    minChangePercent?: number;
    minAbsoluteChange?: number;
    detectPeaks?: boolean;
    detectAnomalies?: boolean;
  } = {}
): Annotation[] => {
  if (!data || data.length < 2) return [];

  const {
    minChangePercent = 25, // 25% change threshold
    minAbsoluteChange = 0,
    detectPeaks = true,
    detectAnomalies = true
  } = options;

  const annotations: Annotation[] = [];
  const values = data.map(d => d[dataKey] || 0);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  for (let i = 1; i < data.length; i++) {
    const current = values[i];
    const previous = values[i - 1];
    const dataPoint = data[i];

    if (previous === 0) continue; // Skip if previous value is 0

    const changePercent = ((current - previous) / previous) * 100;
    const absoluteChange = Math.abs(current - previous);

    // Detect significant increases
    if (changePercent >= minChangePercent && absoluteChange >= minAbsoluteChange) {
      annotations.push({
        dataKey: dataPoint.name,
        value: current,
        label: `+${Math.round(changePercent)}%`,
        type: 'increase',
        color: '#ef4444', // red-500
        position: 'top',
        significance: Math.min(changePercent / 100, 1)
      });
    }

    // Detect significant decreases
    if (changePercent <= -minChangePercent && absoluteChange >= minAbsoluteChange) {
      annotations.push({
        dataKey: dataPoint.name,
        value: current,
        label: `${Math.round(changePercent)}%`,
        type: 'decrease',
        color: '#22c55e', // green-500
        position: 'bottom',
        significance: Math.min(Math.abs(changePercent) / 100, 1)
      });
    }
  }

  // Detect peaks and lows
  if (detectPeaks) {
    const peakIndex = values.indexOf(maxValue);
    const lowIndex = values.indexOf(minValue);

    if (maxValue > average * 1.5) { // Peak is 50% above average
      annotations.push({
        dataKey: data[peakIndex].name,
        value: maxValue,
        label: 'Peak',
        type: 'peak',
        color: '#f59e0b', // amber-500
        position: 'top',
        significance: (maxValue - average) / average
      });
    }

    if (minValue < average * 0.5) { // Low is 50% below average
      annotations.push({
        dataKey: data[lowIndex].name,
        value: minValue,
        label: 'Low',
        type: 'low',
        color: '#3b82f6', // blue-500
        position: 'bottom',
        significance: (average - minValue) / average
      });
    }
  }

  // Detect anomalies (values significantly different from neighbors)
  if (detectAnomalies) {
    for (let i = 1; i < data.length - 1; i++) {
      const current = values[i];
      const prev = values[i - 1];
      const next = values[i + 1];
      const neighborAvg = (prev + next) / 2;

      if (neighborAvg > 0) {
        const anomalyPercent = Math.abs((current - neighborAvg) / neighborAvg) * 100;
        
        if (anomalyPercent >= 50) { // 50% different from neighbors
          annotations.push({
            dataKey: data[i].name,
            value: current,
            label: 'Unusual',
            type: 'anomaly',
            color: '#8b5cf6', // violet-500
            position: current > neighborAvg ? 'top' : 'bottom',
            significance: Math.min(anomalyPercent / 100, 1)
          });
        }
      }
    }
  }

  // Sort by significance and limit to most important annotations
  return annotations
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 5); // Limit to 5 most significant annotations
};

/**
 * Create annotation components for Recharts
 */
export const createChartAnnotations = (
  annotations: Annotation[],
  chartHeight: number = 300
) => {
  return annotations.map((annotation, index) => ({
    key: `annotation-${index}`,
    x: annotation.dataKey,
    y: annotation.value,
    content: (
      <g key={`annotation-${index}`}>
        {/* Annotation dot */}
        <circle
          cx={0}
          cy={0}
          r={6}
          fill={annotation.color}
          stroke="white"
          strokeWidth={2}
          className="animate-pulse"
        />
        
        {/* Annotation label */}
        <text
          x={0}
          y={annotation.position === 'top' ? -15 : 20}
          textAnchor="middle"
          fill={annotation.color}
          fontSize={12}
          fontWeight="bold"
          className="pointer-events-none"
        >
          {annotation.label}
        </text>
        
        {/* Annotation line */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={annotation.position === 'top' ? -10 : 10}
          stroke={annotation.color}
          strokeWidth={2}
          strokeDasharray="2,2"
        />
      </g>
    )
  }));
};

/**
 * Get user-friendly explanation for annotation
 */
export const getAnnotationExplanation = (
  annotation: Annotation,
  t: (key: string) => string
): string => {
  switch (annotation.type) {
    case 'increase':
      return t('significantIncrease', `Usage increased significantly by ${annotation.label}`);
    case 'decrease':
      return t('significantDecrease', `Usage decreased by ${annotation.label}`);
    case 'peak':
      return t('peakUsage', 'Highest usage period - check what caused this spike');
    case 'low':
      return t('lowUsage', 'Lowest usage period - possibly due to reduced activity');
    case 'anomaly':
      return t('unusualUsage', 'Unusual usage pattern - investigate potential causes');
    default:
      return t('significantChange', 'Significant change in usage pattern');
  }
};

/**
 * Enhanced data processing with annotations
 */
export const processDataWithAnnotations = (
  data: DataPoint[],
  dataKey: string,
  options?: {
    minChangePercent?: number;
    detectPeaks?: boolean;
    detectAnomalies?: boolean;
  }
) => {
  const annotations = detectSignificantChanges(data, dataKey, options);
  
  // Add annotation flags to data points
  const enhancedData = data.map(point => {
    const annotation = annotations.find(ann => ann.dataKey === point.name);
    return {
      ...point,
      hasAnnotation: !!annotation,
      annotationType: annotation?.type,
      annotationColor: annotation?.color
    };
  });

  return {
    data: enhancedData,
    annotations
  };
};
