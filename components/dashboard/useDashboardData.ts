// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../../services/descoService';
import { Account, AiSummary, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption } from '../../types';

type UseDashboardDataReturn = {
  processedData: any | null;
  isLoading: boolean;
  error: string | null;
  isAiLoading: boolean;
  isAiAvailable: boolean;
  rechargeYear: number;
  setRechargeYear: (year: number) => void;
  isHistoryLoading: boolean;
  consumptionTimeframe: 'daily' | 'monthly';
  setConsumptionTimeframe: (tf: 'daily' | 'monthly') => void;
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
  const [consumptionTimeframe, setConsumptionTimeframe] = useState<'daily' | 'monthly'>('daily');
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
          api.getCustomerDailyConsumption(account.accountNo, account.meterNo, 30),
          api.getAccountBalance(account.accountNo)
        ]);
        setData({ location, monthlyConsumption, rechargeHistory, dailyConsumption, balance: balanceResult.success ? balanceResult.data : null, aiSummary: null, banglaEnabled: account.banglaEnabled, account });
        if (balanceResult.success) {
          if (account.aiInsightsEnabled) {
            fetchAiSummary(monthlyConsumption, rechargeHistory, balanceResult.data.balance);
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
    const fetchAiSummary = async (monthlyConsumption: MonthlyConsumption[], rechargeHistory: RechargeHistoryItem[], currentBalance: number) => {
      try {
        setIsAiLoading(true);
        setIsAiAvailable(true);
        const currentMonth = new Date().toISOString().substring(0, 7);
        // Get the last 14 days of dailyConsumption
        const recentDailyConsumption = data?.dailyConsumption
          ? [...data.dailyConsumption].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
          : [];
        const aiSummary = await api.getAiDashboardSummary(monthlyConsumption, rechargeHistory, currentBalance, currentMonth, recentDailyConsumption, account.banglaEnabled);
        setData(prevData => prevData ? { ...prevData, aiSummary } : null);
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
    const monthlyConsumptionLast12 = sortedMonthly.slice(-12);
    const formatMonth = (monthStr: string) => new Date(monthStr + '-02').toLocaleString('default', { month: 'short', year: '2-digit' });
    const consumptionChartData = consumptionTimeframe === 'daily'
      ? [...data.dailyConsumption].sort((a,b) => a.date.localeCompare(b.date)).map(d => ({ name: new Date(d.date).toLocaleDateString('default', { day: 'numeric', month: 'short' }), kWh: d.consumedUnit, BDT: d.consumedTaka }))
      : monthlyConsumptionLast12.map(m => ({ name: formatMonth(m.month), kWh: m.consumedUnit, BDT: m.consumedTaka }));
    const prev12Months = sortedMonthly.slice(0, 12);
    const comparisonData = monthlyConsumptionLast12.map((currentMonthData, index) => {
      const prevYearMonthStr = `${parseInt(currentMonthData.month.substring(0, 4)) - 1}-${currentMonthData.month.substring(5, 7)}`;
      const prevYearData = prev12Months.find(p => p.month === prevYearMonthStr);
      return {
        month: new Date(currentMonthData.month + '-02').toLocaleString('default', { month: 'long' }),
        'Current Year': currentMonthData?.[comparisonMetric === 'bdt' ? 'consumedTaka' : 'consumedUnit'] ?? 0,
        'Previous Year': prevYearData?.[comparisonMetric === 'bdt' ? 'consumedTaka' : 'consumedUnit'] ?? 0,
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
      cumulativeKWh: array.slice(0, index + 1).reduce((sum, m) => sum + (m.consumedUnit || 0), 0),
      cumulativeBDT: array.slice(0, index + 1).reduce((sum, m) => sum + m.consumedTaka, 0)
    }));
    const consumptionValues = data.dailyConsumption.map(d => d.consumedUnit).sort((a, b) => a - b);
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
    const gaugeData = data.balance ? {
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
  }, [data, consumptionTimeframe, comparisonMetric]);

  return {
    processedData,
    isLoading,
    error,
    isAiLoading,
    isAiAvailable,
    rechargeYear,
    setRechargeYear,
    isHistoryLoading,
    consumptionTimeframe,
    setConsumptionTimeframe,
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