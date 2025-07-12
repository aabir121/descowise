// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../../services/descoService';
import { Account, AiSummary, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, BalanceData } from '../../types';

type TimeRange = '7days' | '30days' | '3months' | '6months' | '1year' | '2years';

type UseDashboardDataReturn = {
  processedData: any | null;
  isLoading: boolean;
  error: string | null;
  isAiLoading: boolean;
  isAiAvailable: boolean;
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
  handleOpenPortal: () => void;
  handleYearChange: (year: number) => void;
  data: any | null;
};

const useDashboardData = (account: Account): UseDashboardDataReturn => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [portalConfirmation, setPortalConfirmation] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [rechargeYear, setRechargeYear] = useState<number>(new Date().getFullYear());
  const [consumptionTimeRange, setConsumptionTimeRange] = useState<TimeRange>('7days');
  const [comparisonMetric, setComparisonMetric] = useState<'bdt' | 'kwh'>('bdt');

  useEffect(() => {
    const fetchEssentialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [location, monthlyConsumption, rechargeHistory, dailyConsumption, balanceResult] = await Promise.all([
          api.getCustomerLocation(account.accountNo),
          api.getCustomerMonthlyConsumption(account.accountNo, account.meterNo, 24),
          api.getRechargeHistory(account.accountNo, account.meterNo, new Date().getFullYear()),
          api.getCustomerDailyConsumption(account.accountNo, account.meterNo, 60), // Increased to 60 days to support longer ranges
          api.getAccountBalance(account.accountNo)
        ]);
        setData({ location, monthlyConsumption, rechargeHistory, dailyConsumption, balance: balanceResult.success ? balanceResult.data : null, aiSummary: null, banglaEnabled: account.banglaEnabled, account });
        if (balanceResult.success) {
          if (account.aiInsightsEnabled) {
            if (balanceResult.data?.balance !== null && balanceResult.data?.balance !== undefined) {
              fetchAiSummary(monthlyConsumption, rechargeHistory, balanceResult.data, dailyConsumption);
            } else {
              // Generate AI summary even when balance is unavailable
              fetchAiSummary(monthlyConsumption, rechargeHistory, balanceResult.data, dailyConsumption);
            }
          } else {
            setIsAiAvailable(false);
            setData(prevData => prevData ? { ...prevData, aiSummary: null } : null);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    const fetchAiSummary = async (monthlyConsumption: MonthlyConsumption[], rechargeHistory: RechargeHistoryItem[], balanceData: BalanceData | null, dailyConsumption: DailyConsumption[]) => {
      try {
        setIsAiLoading(true);
        setIsAiAvailable(true);
        const currentMonth = new Date().toISOString().substring(0, 7);
        // Get the last 14 days of dailyConsumption
        const recentDailyConsumption = dailyConsumption
          ? [...dailyConsumption].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
          : [];
        const readingTime = balanceData?.readingTime;
        const aiSummary = await api.getAiDashboardSummary(monthlyConsumption, rechargeHistory, balanceData, currentMonth, recentDailyConsumption, account.banglaEnabled);
        setData(prevData => prevData ? { 
          ...prevData, 
          aiSummary,
          balanceUnavailable: balanceData?.balance === null || balanceData?.balance === undefined
        } : null);
      } catch (err) {
        setIsAiAvailable(false);
      } finally {
        setIsAiLoading(false);
      }
    };
    fetchEssentialData();
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
      const newRechargeHistory = await api.getRechargeHistory(account.accountNo, account.meterNo, newYear);
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

  const processedData = useMemo<any | null>(() => {
    if (!data) return null;
    const sortedMonthly = [...data.monthlyConsumption].sort((a, b) => a.month.localeCompare(b.month));
    const sortedDaily = [...data.dailyConsumption].sort((a, b) => a.date.localeCompare(b.date));
    const formatMonth = (monthStr: string) => new Date(monthStr + '-02').toLocaleString('default', { month: 'short', year: '2-digit' });
    
    // Calculate consumption chart data based on time range
    let consumptionChartData;
    if (consumptionTimeRange === '7days') {
      const last7Days = sortedDaily.slice(-7);
      consumptionChartData = last7Days.map(d => ({ 
        name: new Date(d.date).toLocaleDateString('default', { day: 'numeric', month: 'short' }), 
        kWh: (d.consumedUnit || 0), 
        BDT: d.consumedTaka 
      }));
    } else if (consumptionTimeRange === '30days') {
      const last30Days = sortedDaily.slice(-30);
      consumptionChartData = last30Days.map(d => ({ 
        name: new Date(d.date).toLocaleDateString('default', { day: 'numeric', month: 'short' }), 
        kWh: (d.consumedUnit || 0), 
        BDT: d.consumedTaka 
      }));
    } else {
      // For monthly ranges, determine how many months to show
      let monthsToShow = 12; // default
      if (consumptionTimeRange === '3months') monthsToShow = 3;
      else if (consumptionTimeRange === '6months') monthsToShow = 6;
      else if (consumptionTimeRange === '1year') monthsToShow = 12;
      else if (consumptionTimeRange === '2years') monthsToShow = 24;
      
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
    const rechargeVsConsumptionData = monthlyConsumptionLast12.map(mc => {
      const rechargesInMonth = data.rechargeHistory
        .filter(rh => rh.rechargeDate.startsWith(mc.month))
        .reduce((sum, rh) => sum + rh.totalAmount, 0);
      return {
        month: formatMonth(mc.month),
        Consumption: mc.consumedTaka,
        Recharge: rechargesInMonth,
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
    const gaugeData = data.balance && data.balance.balance !== null && data.balance.balance !== undefined ? {
      currentBalance: data.balance.balance,
      averageMonthlyCost,
      daysRemaining: Math.floor(data.balance.balance / (averageMonthlyCost / 30)),
      percentage: Math.min((data.balance.balance / averageMonthlyCost) * 100, 100)
    } : null;
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

  return {
    processedData,
    isLoading,
    error,
    isAiLoading,
    isAiAvailable,
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
    handleOpenPortal,
    handleYearChange,
    data,
  };
};

export default useDashboardData; 