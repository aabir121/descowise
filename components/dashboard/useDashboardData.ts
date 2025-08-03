// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../../services/descoService';
import { Account, AiSummary, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, BalanceData, AiError } from '../../types';
import {
  DistributedAiInsights,
  AiLoadingStates,
  distributeAiInsights,
  createInitialLoadingStates,
  startAiAnalysis,
  completeAiAnalysis,
  failAiAnalysis
} from '../../utils/aiInsightDistribution';
import { shouldEnableAiFeatures } from '../../utils/deploymentConfig';
import { getUserApiKey } from '../../utils/apiKeyStorage';
import { BalanceCalculator } from '../../utils/balanceCalculations';
import {
  getCachedAiResponse,
  cacheAiResponse,
  isCacheValid,
  getCacheStatus,
  forceRefresh
} from '../../utils/aiCacheManager';

type TimeRange = 'thisMonth' | '6months' | '1year';

type UseDashboardDataReturn = {
  processedData: any | null;
  isLoading: boolean;
  error: string | null;
  isAiLoading: boolean;
  isAiAvailable: boolean;
  aiError: AiError | null;
  rechargeYear: number;
  setRechargeYear: (year: number) => void;
  isHistoryLoading: boolean;
  consumptionTimeRange: TimeRange;
  setConsumptionTimeRange: (range: TimeRange) => void;
  comparisonMetric: 'bdt' | 'kwh';
  setComparisonMetric: (metric: 'bdt' | 'kwh') => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  portalConfirmation: { isOpen: boolean };
  setPortalConfirmation: (state: { isOpen: boolean }) => void;
  deleteConfirmation: { isOpen: boolean; accountNo?: string };
  setDeleteConfirmation: (state: { isOpen: boolean; accountNo?: string }) => void;
  handleOpenPortal: () => void;
  handleDeleteAccount: (accountNo: string) => void;
  handleYearChange: (year: number) => void;
  data: any | null;
  retryAiSummary: () => void;
  forceRefreshAiSummary: () => void;
  // New distributed AI insights
  distributedAiInsights: DistributedAiInsights | null;
  aiLoadingStates: AiLoadingStates;
  // AI Cache information
  isUsingCache: boolean;
  cacheStatus: {
    isCached: boolean;
    isStale: boolean;
    lastFetch: Date | null;
    timeRemaining: number;
  };
};

const useDashboardData = (account: Account): UseDashboardDataReturn => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataProcessing, setIsDataProcessing] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(true);
  const [aiError, setAiError] = useState<AiError | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [portalConfirmation, setPortalConfirmation] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountNo?: string }>({ isOpen: false });
  const [rechargeYear, setRechargeYear] = useState<number>(new Date().getFullYear());
  const [consumptionTimeRange, setConsumptionTimeRange] = useState<TimeRange>('thisMonth');
  const [comparisonMetric, setComparisonMetric] = useState<'bdt' | 'kwh'>('bdt');

  // Distributed AI insights state
  const [distributedAiInsights, setDistributedAiInsights] = useState<DistributedAiInsights | null>(null);
  const [aiLoadingStates, setAiLoadingStates] = useState<AiLoadingStates>(createInitialLoadingStates());

  // AI Cache state
  const [isUsingCache, setIsUsingCache] = useState<boolean>(false);
  const [cacheStatus, setCacheStatus] = useState<{
    isCached: boolean;
    isStale: boolean;
    lastFetch: Date | null;
    timeRemaining: number;
  }>({ isCached: false, isStale: false, lastFetch: null, timeRemaining: 0 });

  // Move fetchAiSummary outside useEffect so it can be accessed by other functions
  const fetchAiSummary = useCallback(async (monthlyConsumption: MonthlyConsumption[], rechargeHistory: RechargeHistoryItem[], balanceData: BalanceData | null, dailyConsumption: DailyConsumption[], forceRefreshCache: boolean = false) => {
    try {
      // Update cache status
      const currentCacheStatus = getCacheStatus(account.accountNo);
      setCacheStatus(currentCacheStatus);

      // Check for cached response first (unless force refresh is requested)
      if (!forceRefreshCache) {
        const cachedResponse = getCachedAiResponse(account.accountNo, monthlyConsumption, rechargeHistory, balanceData, dailyConsumption);
        if (cachedResponse) {
          console.log('Using cached AI insights');
          setIsUsingCache(true);
          setIsAiLoading(false);
          setIsAiAvailable(true);
          setAiError(null);

          setData(prevData => prevData ? { ...prevData, aiSummary: cachedResponse } : null);

          // Distribute cached AI insights
          const distributed = distributeAiInsights(cachedResponse);
          setDistributedAiInsights(distributed);
          setAiLoadingStates(completeAiAnalysis);
          return;
        }
      }

      // No valid cache found or force refresh requested - fetch from API
      setIsUsingCache(false);
      setIsAiLoading(true);
      setIsAiAvailable(true);
      setAiError(null);
      // Start AI loading for all panels
      setAiLoadingStates(startAiAnalysis);

      const currentMonth = new Date().toISOString().substring(0, 7);
      // Get the last 14 days of dailyConsumption
      const recentDailyConsumption = dailyConsumption
        ? [...dailyConsumption].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
        : [];
      const aiResponse = await api.getAiDashboardSummary(monthlyConsumption, rechargeHistory, balanceData, currentMonth, recentDailyConsumption, account.banglaEnabled);

      if (aiResponse.success && aiResponse.data) {
        // Cache the fresh response
        cacheAiResponse(account.accountNo, aiResponse.data, monthlyConsumption, rechargeHistory, balanceData, dailyConsumption);

        // Update cache status
        setCacheStatus(getCacheStatus(account.accountNo));

        // Distribute AI insights across panels
        const distributed = distributeAiInsights(aiResponse.data);
        setDistributedAiInsights(distributed);

        setData(prevData => prevData ? {
          ...prevData,
          aiSummary: aiResponse.data,
          balanceUnavailable: balanceData?.balance === null || balanceData?.balance === undefined,
          aiError: null
        } : null);

        setIsAiAvailable(true);

        // Complete AI loading for all panels
        setAiLoadingStates(completeAiAnalysis);
      } else {
        // Handle AI error
        setAiError(aiResponse.error || {
          type: 'unknown',
          message: 'AI analysis failed',
          details: 'An unexpected error occurred during AI analysis.',
          retryable: true
        });
        setData(prevData => prevData ? { ...prevData, aiError: aiResponse.error } : { aiError: aiResponse.error });
        setIsAiAvailable(false);
        // Fail AI loading for all panels
        setAiLoadingStates(failAiAnalysis);
      }
    } catch (err) {
      setAiError({
        type: 'unknown',
        message: 'AI analysis failed',
        details: err.message || 'An unexpected error occurred.',
        retryable: true
      });
      setData(prevData => prevData ? { ...prevData, aiError: {
        type: 'unknown',
        message: 'AI analysis failed',
        details: err.message || 'An unexpected error occurred.',
        retryable: true
      }} : { aiError: {
        type: 'unknown',
        message: 'AI analysis failed',
        details: err.message || 'An unexpected error occurred.',
        retryable: true
      }});
      setIsAiAvailable(false);
      // Fail AI loading for all panels
      setAiLoadingStates(failAiAnalysis);
    } finally {
      setIsAiLoading(false);
    }
  }, [account.accountNo, account.banglaEnabled]);

  useEffect(() => {
    let isMounted = true;

    const fetchEssentialData = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setIsDataProcessing(true);
        setError(null);

        // Calculate date range for consistent 24-month period across all data sources
        const today = new Date();
        const toMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const fromMonth = new Date();
        fromMonth.setMonth(toMonth.getMonth() - 23); // 24 months total (0-23)

        // Convert to date range for recharge history (from first day of fromMonth to last day of current month)
        const rechargeFromDate = new Date(fromMonth.getFullYear(), fromMonth.getMonth(), 1);
        const rechargeToDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month



        const [location, monthlyConsumption, rechargeHistory, dailyConsumption, balanceResult] = await Promise.all([
          api.getCustomerLocation(account.accountNo),
          api.getCustomerMonthlyConsumption(account.accountNo, account.meterNo, 24),
          api.getRechargeHistory(account.accountNo, account.meterNo, rechargeFromDate, rechargeToDate),
          api.getCustomerDailyConsumption(account.accountNo, account.meterNo, 90), // Increased to 90 days to ensure we have enough recent data
          api.getAccountBalance(account.accountNo)
        ]);

        if (!isMounted) return;

        // Set data immediately but keep processing state active
        setData({
          location,
          monthlyConsumption,
          rechargeHistory,
          dailyConsumption,
          balance: balanceResult.success ? balanceResult.data : null,
          aiSummary: null,
          banglaEnabled: account.banglaEnabled,
          account
        });

        // Allow a brief moment for data to be processed and UI to stabilize
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted) return;
        setIsDataProcessing(false);

        if (balanceResult.success) {
          // Check if AI features should be enabled based on deployment and API key availability
          const userApiKey = await getUserApiKey();
          const aiShouldBeEnabled = account.aiInsightsEnabled && shouldEnableAiFeatures(userApiKey);

          if (aiShouldBeEnabled) {
            if (balanceResult.data?.balance !== null && balanceResult.data?.balance !== undefined) {
              fetchAiSummary(monthlyConsumption, rechargeHistory, balanceResult.data, dailyConsumption);
            } else {
              // Generate AI summary even when balance is unavailable
              fetchAiSummary(monthlyConsumption, rechargeHistory, balanceResult.data, dailyConsumption);
            }
          } else {
            if (!isMounted) return;
            setIsAiAvailable(false);
            setData(prevData => prevData ? { ...prevData, aiSummary: null } : null);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load dashboard data. Please try again later.');
        setIsDataProcessing(false);
      } finally {
        if (!isMounted) return;
        // Only set loading to false after data processing is complete
        // This prevents flashing by ensuring processed data is ready
        setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, 50);
      }
    };

    // Use the fetchAiSummary function defined outside useEffect

    
    fetchEssentialData();
    
    return () => {
      isMounted = false;
    };
  }, [account.accountNo, account.meterNo]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleYearChange = useCallback(async (newYear: number) => {
    setRechargeYear(newYear);
    setIsHistoryLoading(true);
    try {
      const newRechargeHistory = await api.getRechargeHistoryByYear(account.accountNo, account.meterNo, newYear);
      setData(prev => prev ? { ...prev, rechargeHistory: newRechargeHistory } : null);
    } catch (err) {
      setError(`Failed to load recharge history for ${newYear}.`);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [account.accountNo, account.meterNo]);

  const handleOpenPortal = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNo);
      setNotification(`Account ID "${account.accountNo}" copied to clipboard! Opening official DESCO portal...`);
      setTimeout(() => {
        window.open('https://prepaid.desco.org.bd/customer/#/customer-login', '_blank', 'noopener,noreferrer');
      }, 2500);
    } catch (err) {
      setNotification('Could not copy account number to clipboard.');
    }
  };

  const handleDeleteAccount = (accountNo: string) => {
    setDeleteConfirmation({ isOpen: true, accountNo });
  };

  const processedData = useMemo<any | null>(() => {
    if (!data) return null;
    const sortedMonthly = [...data.monthlyConsumption].sort((a, b) => a.month.localeCompare(b.month));
    const sortedDaily = [...data.dailyConsumption].sort((a, b) => a.date.localeCompare(b.date));
    const formatMonth = (monthStr: string) => new Date(monthStr + '-02').toLocaleString('default', { month: 'short', year: '2-digit' });
    
    // Helper function to set a date to local midnight
    const toLocalMidnight = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    // Helper to get YYYY-MM-DD string in local time
    const getLocalIsoDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper function to fill missing dates with zeros and mark missing
    const fillMissingDates = (data: any[], startDate: Date, endDate: Date) => {
      const dateMap = new Map();
      data.forEach(item => {
        // Clamp all data dates to local midnight for comparison
        const d = new Date(item.date);
        const localMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        dateMap.set(getLocalIsoDateString(localMidnight), { ...item, date: getLocalIsoDateString(localMidnight) });
      });
      const result = [];
      let currentDate = toLocalMidnight(new Date(startDate));
      const end = toLocalMidnight(new Date(endDate));
      while (currentDate <= end) {
        const dateStr = getLocalIsoDateString(currentDate);
        const existingData = dateMap.get(dateStr);
        if (existingData) {
          result.push({ ...existingData, missing: false });
        } else {
          result.push({
            date: dateStr,
            consumedUnit: 0,
            consumedTaka: 0,
            missing: true
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return result;
    };
    
    // Calculate consumption chart data based on time range
    let consumptionChartData;
    if (consumptionTimeRange === 'thisMonth') {
      // Get current month's data from 1st day to today, both at local midnight
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // Only use daily data from this month
      const thisMonthDaily = sortedDaily.filter(d => {
        const dDate = new Date(d.date);
        return dDate >= firstDayOfMonth && dDate <= todayMidnight;
      });
      const thisMonthData = fillMissingDates(thisMonthDaily, firstDayOfMonth, todayMidnight);
      consumptionChartData = thisMonthData.map(d => ({ 
        name: new Date(d.date).toLocaleDateString('default', { day: 'numeric', month: 'short' }), 
        kWh: (d.consumedUnit || 0), 
        BDT: d.consumedTaka,
        missing: d.missing
      }));
    } else {
      // For monthly ranges, determine how many months to show
      let monthsToShow = 12; // default for 1year
      if (consumptionTimeRange === '6months') monthsToShow = 6;
      
      const monthlyConsumptionForRange = sortedMonthly.slice(-monthsToShow);
      consumptionChartData = monthlyConsumptionForRange.map(m => ({ 
        name: formatMonth(m.month), 
        kWh: (m.consumedUnit || 0), 
        BDT: m.consumedTaka 
      }));
    }
    const monthlyConsumptionLast12 = sortedMonthly.slice(-12);
    const prev12Months = sortedMonthly.slice(0, 12);
    const comparisonData = monthlyConsumptionLast12.map((currentMonthData, index) => {
      const prevYearMonthStr = `${parseInt(currentMonthData.month.substring(0, 4)) - 1}-${currentMonthData.month.substring(5, 7)}`;
      const prevYearData = prev12Months.find(p => p.month === prevYearMonthStr);
      return {
        month: new Date(currentMonthData.month + '-02').toLocaleString('default', { month: 'long' }),
        'Current Year': comparisonMetric === 'bdt' ? (currentMonthData?.consumedTaka ?? 0) : ((currentMonthData?.consumedUnit ?? 0)),
        'Previous Year': comparisonMetric === 'bdt' ? (prevYearData?.consumedTaka ?? 0) : ((prevYearData?.consumedUnit ?? 0)),
      };
    });
    // Data processing for net balance analysis

    const rechargeVsConsumptionData = monthlyConsumptionLast12.map(mc => {
      // Ensure we have valid data and handle null/undefined values
      const monthStr = mc.month || '';
      const consumptionAmount = mc.consumedTaka || 0;



      // Filter recharges for this month with better error handling and debugging
      const matchingRecharges = (data.rechargeHistory || [])
        .filter(rh => {
          // Ensure rechargeDate exists and is valid
          if (!rh || !rh.rechargeDate || typeof rh.rechargeDate !== 'string') {
            return false;
          }

          // Extract YYYY-MM from recharge date for comparison
          // Handle different possible date formats
          let rechargeDateStr;
          try {
            // Try to parse as date first to handle various formats
            const rechargeDate = new Date(rh.rechargeDate);
            if (!isNaN(rechargeDate.getTime())) {
              // If it's a valid date, format it as YYYY-MM
              const year = rechargeDate.getFullYear();
              const month = (rechargeDate.getMonth() + 1).toString().padStart(2, '0');
              rechargeDateStr = `${year}-${month}`;
            } else {
              // Fallback to substring method
              rechargeDateStr = rh.rechargeDate.substring(0, 7);
            }
          } catch (e) {
            // If date parsing fails, use substring method
            rechargeDateStr = rh.rechargeDate.substring(0, 7);
          }

          const matches = rechargeDateStr === monthStr;
          return matches;
        });

      const rechargesInMonth = matchingRecharges.reduce((sum, rh) => {
        // Ensure totalAmount is a valid number
        const amount = typeof rh.totalAmount === 'number' ? rh.totalAmount : 0;
        return sum + amount;
      }, 0);

      // Ensure we return valid numbers (never null/undefined)
      const validConsumption = Math.max(0, consumptionAmount || 0);
      const validRecharge = Math.max(0, rechargesInMonth || 0);

      return {
        month: formatMonth(monthStr),
        Consumption: validConsumption,
        Recharge: validRecharge,
      };
    });
    const maxDemandData = monthlyConsumptionLast12.map(mc => ({ month: formatMonth(mc.month), 'Max Demand (kW)': mc.maximumDemand }));
    const rechargeDistributionData = data.rechargeHistory.reduce((acc: Record<string, number>, item) => {
      const operator = item.rechargeOperator || 'Unknown';
      acc[operator] = (acc[operator] || 0) + item.totalAmount;
      return acc;
    }, {});
    const pieChartData = Object.entries(rechargeDistributionData).map(([operator, amount]) => ({
      name: operator,
      value: amount,
      percentage: ((amount as number / Object.values(rechargeDistributionData).reduce((sum, val) => sum + (val as number), 0)) * 100).toFixed(1)
    }));
    const cumulativeData = sortedMonthly.map((item, index, array) => ({
      month: formatMonth(item.month),
      cumulativeKWh: array.slice(0, index + 1).reduce((sum, m) => sum + ((m.consumedUnit || 0)), 0),
      cumulativeBDT: array.slice(0, index + 1).reduce((sum, m) => sum + m.consumedTaka, 0)
    }));
    const consumptionValues = data.dailyConsumption.map(d => (d.consumedUnit || 0)).sort((a, b) => a - b);
    const boxPlotData = consumptionValues.length > 0 ? {
      min: consumptionValues[0],
      q1: consumptionValues[Math.floor(consumptionValues.length * 0.25)],
      median: consumptionValues[Math.floor(consumptionValues.length * 0.5)],
      q3: consumptionValues[Math.floor(consumptionValues.length * 0.75)],
      max: consumptionValues[consumptionValues.length - 1]
    } : null;
    const monthlyCostData = sortedMonthly.map(item => ({
      month: formatMonth(item.month),
      'Monthly Cost (BDT)': item.consumedTaka
    }));
    const averageMonthlyCost = sortedMonthly.slice(-6).reduce((sum, m) => sum + m.consumedTaka, 0) / 6;

    // Use unified balance calculation system for consistency
    const gaugeData = data.balance && data.balance.balance !== null && data.balance.balance !== undefined ? (() => {
      try {
        const balanceCalc = BalanceCalculator.calculateRemainingDays(
          data.balance.balance,
          sortedMonthly,
          data.dailyConsumption || [],
          {
            preferredMethod: BalanceCalculator.getRecommendedMethod(sortedMonthly, data.dailyConsumption || []),
            seasonalAdjustment: true,
            dataPointsLimit: 60,
            fallbackToBasic: true
          }
        );

        return {
          currentBalance: data.balance.balance,
          averageMonthlyCost: balanceCalc.monthlyAverageCost,
          daysRemaining: balanceCalc.daysRemaining,
          percentage: Math.min((data.balance.balance / balanceCalc.monthlyAverageCost) * 100, 100),
          calculationMethod: balanceCalc.calculationMethod,
          confidence: balanceCalc.confidence,
          dataPoints: balanceCalc.dataPoints,
          details: balanceCalc.details
        };
      } catch (error) {
        console.warn('Unified balance calculation failed, using fallback:', error);
        // Fallback to original calculation
        return {
          currentBalance: data.balance.balance,
          averageMonthlyCost,
          daysRemaining: Math.floor(data.balance.balance / (averageMonthlyCost / 30)),
          percentage: Math.min((data.balance.balance / averageMonthlyCost) * 100, 100),
          calculationMethod: 'fallback',
          confidence: 0.5,
          dataPoints: 6,
          details: 'Fallback calculation using 6-month average'
        };
      }
    })() : null;
    return {
      consumptionChartData,
      comparisonData,
      rechargeVsConsumptionData,
      maxDemandData,
      pieChartData,
      cumulativeData,
      boxPlotData,
      monthlyCostData,
      gaugeData
    };
  }, [data, consumptionTimeRange, comparisonMetric]);

  // Add retry handler for AI summary
  const retryAiSummary = useCallback(() => {
    setAiError(null);
    if (data) {
      fetchAiSummary(
        data.monthlyConsumption || [],
        data.rechargeHistory || [],
        data.balance,
        data.dailyConsumption || []
      );
    }
  }, [data, fetchAiSummary]);

  // Add force refresh handler for AI summary
  const forceRefreshAiSummary = useCallback(() => {
    setAiError(null);
    forceRefresh(account.accountNo);
    if (data) {
      fetchAiSummary(
        data.monthlyConsumption || [],
        data.rechargeHistory || [],
        data.balance,
        data.dailyConsumption || [],
        true // Force refresh
      );
    }
  }, [data, account.accountNo, fetchAiSummary]);

  return {
    processedData,
    isLoading: isLoading || isDataProcessing, // Include data processing in loading state
    error,
    isAiLoading,
    isAiAvailable,
    aiError,
    rechargeYear,
    setRechargeYear,
    isHistoryLoading,
    consumptionTimeRange,
    setConsumptionTimeRange,
    comparisonMetric,
    setComparisonMetric,
    notification,
    setNotification,
    portalConfirmation,
    setPortalConfirmation,
    deleteConfirmation,
    setDeleteConfirmation,
    handleOpenPortal,
    handleDeleteAccount,
    handleYearChange,
    data,
    retryAiSummary,
    forceRefreshAiSummary,
    // New distributed AI insights
    distributedAiInsights,
    aiLoadingStates,
    // AI Cache information
    isUsingCache,
    cacheStatus,
  };
};

export default useDashboardData; 