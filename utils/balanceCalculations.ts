import { MonthlyConsumption, DailyConsumption, BalanceData } from '../types';

export interface BalanceCalculationResult {
  daysRemaining: number;
  dailyAverageCost: number;
  monthlyAverageCost: number;
  calculationMethod: 'daily' | 'monthly' | 'statistical' | 'ai';
  confidence: number;
  dataPoints: number;
  seasonalAdjustment?: number;
  details: string;
}

export interface BalanceCalculationOptions {
  preferredMethod?: 'daily' | 'monthly' | 'statistical' | 'ai';
  seasonalAdjustment?: boolean;
  dataPointsLimit?: number;
  fallbackToBasic?: boolean;
}

/**
 * Unified balance calculation system that provides consistent results across all dashboard sections
 */
export class BalanceCalculator {
  
  /**
   * Calculate remaining days using multiple methods with intelligent fallback
   */
  static calculateRemainingDays(
    currentBalance: number,
    monthlyConsumption: MonthlyConsumption[],
    dailyConsumption: DailyConsumption[],
    options: BalanceCalculationOptions = {}
  ): BalanceCalculationResult {
    
    const {
      preferredMethod = 'statistical',
      seasonalAdjustment = true,
      dataPointsLimit = 60,
      fallbackToBasic = true
    } = options;

    // Try preferred method first, then fallback
    const methods = [preferredMethod, 'statistical', 'daily', 'monthly'];
    
    for (const method of methods) {
      try {
        const result = this.calculateByMethod(
          currentBalance,
          monthlyConsumption,
          dailyConsumption,
          method,
          { seasonalAdjustment, dataPointsLimit }
        );
        
        if (result && result.daysRemaining > 0) {
          return result;
        }
      } catch (error) {
        console.warn(`Balance calculation method '${method}' failed:`, error);
        continue;
      }
    }

    // Ultimate fallback
    if (fallbackToBasic) {
      return this.basicFallbackCalculation(currentBalance, monthlyConsumption);
    }

    throw new Error('All balance calculation methods failed');
  }

  /**
   * Calculate using a specific method
   */
  private static calculateByMethod(
    currentBalance: number,
    monthlyConsumption: MonthlyConsumption[],
    dailyConsumption: DailyConsumption[],
    method: string,
    options: { seasonalAdjustment: boolean; dataPointsLimit: number }
  ): BalanceCalculationResult | null {

    switch (method) {
      case 'statistical':
        return this.statisticalCalculation(currentBalance, dailyConsumption, options);
      
      case 'daily':
        return this.dailyAverageCalculation(currentBalance, dailyConsumption, options);
      
      case 'monthly':
        return this.monthlyAverageCalculation(currentBalance, monthlyConsumption, options);
      
      default:
        return null;
    }
  }

  /**
   * Statistical calculation with seasonal adjustment (most accurate)
   */
  private static statisticalCalculation(
    currentBalance: number,
    dailyConsumption: DailyConsumption[],
    options: { seasonalAdjustment: boolean; dataPointsLimit: number }
  ): BalanceCalculationResult | null {
    
    if (!dailyConsumption || dailyConsumption.length === 0) return null;

    // Use recent data points (last 30-60 days)
    const recentData = dailyConsumption
      .filter(d => d.consumedTaka && d.consumedTaka > 0)
      .slice(-options.dataPointsLimit);

    if (recentData.length < 7) return null; // Need at least a week of data

    // Calculate average daily cost
    const totalCost = recentData.reduce((sum, item) => sum + (item.consumedTaka || 0), 0);
    const avgDailyCost = totalCost / recentData.length;

    if (avgDailyCost <= 0) return null;

    // Apply seasonal adjustment if enabled
    let adjustedDailyCost = avgDailyCost;
    let seasonalMultiplier = 1.0;
    
    if (options.seasonalAdjustment) {
      const currentMonth = new Date().getMonth();
      // Seasonal multipliers: Jan=1.1, Feb=1.1, Mar=1.0, Apr=0.9, May=0.8, Jun=0.7, Jul=0.7, Aug=0.8, Sep=0.9, Oct=1.0, Nov=1.1, Dec=1.2
      seasonalMultiplier = [1.1, 1.1, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2][currentMonth];
      adjustedDailyCost = avgDailyCost * seasonalMultiplier;
    }

    // Calculate statistical confidence
    const costs = recentData.map(item => item.consumedTaka || 0);
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avgDailyCost, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgDailyCost > 0 ? stdDev / avgDailyCost : 1;
    const confidence = Math.max(0.3, Math.min(0.95, 1 - coefficientOfVariation));

    const daysRemaining = Math.floor(currentBalance / adjustedDailyCost);

    return {
      daysRemaining,
      dailyAverageCost: adjustedDailyCost,
      monthlyAverageCost: adjustedDailyCost * 30,
      calculationMethod: 'statistical',
      confidence,
      dataPoints: recentData.length,
      seasonalAdjustment: seasonalMultiplier,
      details: `Based on ${recentData.length} recent daily consumption records with ${options.seasonalAdjustment ? `seasonal adjustment (${(seasonalMultiplier * 100).toFixed(0)}%)` : 'no seasonal adjustment'}`
    };
  }

  /**
   * Simple daily average calculation
   */
  private static dailyAverageCalculation(
    currentBalance: number,
    dailyConsumption: DailyConsumption[],
    options: { dataPointsLimit: number }
  ): BalanceCalculationResult | null {
    
    if (!dailyConsumption || dailyConsumption.length === 0) return null;

    const recentData = dailyConsumption
      .filter(d => d.consumedTaka && d.consumedTaka > 0)
      .slice(-Math.min(options.dataPointsLimit, 30)); // Max 30 days for daily average

    if (recentData.length === 0) return null;

    const totalCost = recentData.reduce((sum, item) => sum + (item.consumedTaka || 0), 0);
    const avgDailyCost = totalCost / recentData.length;

    if (avgDailyCost <= 0) return null;

    const daysRemaining = Math.floor(currentBalance / avgDailyCost);

    return {
      daysRemaining,
      dailyAverageCost: avgDailyCost,
      monthlyAverageCost: avgDailyCost * 30,
      calculationMethod: 'daily',
      confidence: 0.7,
      dataPoints: recentData.length,
      details: `Based on ${recentData.length} days of recent consumption data`
    };
  }

  /**
   * Monthly average calculation
   */
  private static monthlyAverageCalculation(
    currentBalance: number,
    monthlyConsumption: MonthlyConsumption[],
    options: { dataPointsLimit: number }
  ): BalanceCalculationResult | null {
    
    if (!monthlyConsumption || monthlyConsumption.length === 0) return null;

    const recentMonths = monthlyConsumption
      .filter(m => m.consumedTaka && m.consumedTaka > 0)
      .slice(-Math.min(options.dataPointsLimit, 12)); // Max 12 months

    if (recentMonths.length === 0) return null;

    const totalCost = recentMonths.reduce((sum, item) => sum + (item.consumedTaka || 0), 0);
    const avgMonthlyCost = totalCost / recentMonths.length;
    const avgDailyCost = avgMonthlyCost / 30;

    if (avgDailyCost <= 0) return null;

    const daysRemaining = Math.floor(currentBalance / avgDailyCost);

    return {
      daysRemaining,
      dailyAverageCost: avgDailyCost,
      monthlyAverageCost: avgMonthlyCost,
      calculationMethod: 'monthly',
      confidence: 0.6,
      dataPoints: recentMonths.length,
      details: `Based on ${recentMonths.length} months of consumption data`
    };
  }

  /**
   * Basic fallback calculation when all else fails
   */
  private static basicFallbackCalculation(
    currentBalance: number,
    monthlyConsumption: MonthlyConsumption[]
  ): BalanceCalculationResult {
    
    // Use last 6 months or available data
    const recentMonths = monthlyConsumption.slice(-6);
    const avgMonthlyCost = recentMonths.length > 0
      ? recentMonths.reduce((sum, m) => sum + (m.consumedTaka || 0), 0) / recentMonths.length
      : 3000; // Default fallback

    const avgDailyCost = avgMonthlyCost / 30;
    const daysRemaining = Math.floor(currentBalance / avgDailyCost);

    return {
      daysRemaining: Math.max(0, daysRemaining),
      dailyAverageCost: avgDailyCost,
      monthlyAverageCost: avgMonthlyCost,
      calculationMethod: 'monthly',
      confidence: 0.4,
      dataPoints: recentMonths.length,
      details: `Basic calculation using ${recentMonths.length || 'default'} months of data`
    };
  }

  /**
   * Get calculation method priority based on available data
   */
  static getRecommendedMethod(
    monthlyConsumption: MonthlyConsumption[],
    dailyConsumption: DailyConsumption[]
  ): 'daily' | 'monthly' | 'statistical' {
    
    const recentDailyData = dailyConsumption?.filter(d => d.consumedTaka && d.consumedTaka > 0) || [];
    const recentMonthlyData = monthlyConsumption?.filter(m => m.consumedTaka && m.consumedTaka > 0) || [];

    // If we have enough recent daily data, use statistical method
    if (recentDailyData.length >= 14) {
      return 'statistical';
    }
    
    // If we have some daily data, use daily average
    if (recentDailyData.length >= 7) {
      return 'daily';
    }
    
    // Fallback to monthly if we have monthly data
    if (recentMonthlyData.length >= 3) {
      return 'monthly';
    }
    
    return 'monthly'; // Ultimate fallback
  }
}
