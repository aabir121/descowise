import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ResponsiveContainer, BarChart, LineChart, PieChart, AreaChart, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, Pie, Cell, Area, Scatter } from 'recharts';
import { Account, AiSummary, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption } from '../types';
import * as api from '../services/descoService';
import { ArrowLeftIcon, TrashIcon, WandSparklesIcon, ExternalLinkIcon, BuildingOfficeIcon, ExclamationTriangleIcon } from './Icons';
import Spinner from './Spinner';
import ConfirmationDialog from './ConfirmationDialog';

interface DashboardData {
    aiSummary: AiSummary | null;
    location: CustomerLocation | null;
    monthlyConsumption: MonthlyConsumption[];
    dailyConsumption: DailyConsumption[];
    rechargeHistory: RechargeHistoryItem[];
    balance: any | null;
}

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen }) => (
    <details className="bg-slate-800 rounded-xl overflow-hidden" open={defaultOpen}>
        <summary className="p-4 sm:p-6 text-lg font-bold text-slate-100 cursor-pointer hover:bg-slate-700/50 transition-colors">
            {title}
        </summary>
        <div className="p-4 sm:p-6 border-t border-slate-700">
            {children}
        </div>
    </details>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string | number }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-700/80 backdrop-blur-sm p-3 rounded-md border border-slate-600 shadow-lg text-sm">
                <p className="font-bold text-cyan-300 mb-2">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color }}>{`${p.name}: ${p.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
                ))}
            </div>
        );
    }
    return null;
};

const AccountDashboardView: React.FC<{ account: Account; onClose: () => void; onDelete: (accountNo: string) => void; showNotification: (message: string) => void; }> = ({ account, onClose, onDelete, showNotification }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiAvailable, setIsAiAvailable] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [portalConfirmation, setPortalConfirmation] = useState<{ isOpen: boolean }>({ isOpen: false });
    const [rechargeYear, setRechargeYear] = useState(new Date().getFullYear());
    const [consumptionTimeframe, setConsumptionTimeframe] = useState<'daily' | 'monthly'>('daily');
    const [comparisonMetric, setComparisonMetric] = useState<'bdt' | 'kwh'>('bdt');

    useEffect(() => {
        const fetchEssentialData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Fetch all non-AI data first for a faster initial render
                const [location, monthlyConsumption, rechargeHistory, dailyConsumption, balanceResult] = await Promise.all([
                    api.getCustomerLocation(account.accountNo),
                    api.getCustomerMonthlyConsumption(account.accountNo, account.meterNo, 24),
                    api.getRechargeHistory(account.accountNo, account.meterNo, new Date().getFullYear()),
                    api.getCustomerDailyConsumption(account.accountNo, account.meterNo, 30),
                    api.getAccountBalance(account.accountNo)
                ]);

                setData({ location, monthlyConsumption, rechargeHistory, dailyConsumption, balance: balanceResult.success ? balanceResult.data : null, aiSummary: null });
                
                // Start AI summary generation in the background (non-blocking)
                if (balanceResult.success) {
                    fetchAiSummary(monthlyConsumption, rechargeHistory, balanceResult.data.balance);
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
                const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
                const aiSummary = await api.getAiDashboardSummary(monthlyConsumption, rechargeHistory, currentBalance, currentMonth);
                setData(prevData => prevData ? { ...prevData, aiSummary } : null);
            } catch (err: any) {
                console.warn('AI summary generation failed:', err.message);
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
        } catch (err: any) {
            setError(`Failed to load recharge history for ${newYear}.`);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [account.accountNo, account.meterNo]);

    const handleOpenPortal = async () => {
        try {
            await navigator.clipboard.writeText(account.accountNo);
            setNotification(`Account ID "${account.accountNo}" copied to clipboard! Opening official DESCO portal...`);
            
            // Wait for 2.5 seconds to show the notification, then open the portal
            setTimeout(() => {
                window.open('https://prepaid.desco.org.bd/customer/#/customer-login', '_blank', 'noopener,noreferrer');
            }, 2500);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setNotification('Could not copy account number to clipboard.');
        }
    };


    const processedData = useMemo(() => {
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

        // Process recharge distribution by operator
        const rechargeDistributionData = data.rechargeHistory.reduce((acc, item) => {
            const operator = item.rechargeOperator || 'Unknown';
            acc[operator] = (acc[operator] || 0) + item.totalAmount;
            return acc;
        }, {} as Record<string, number>);

        const pieChartData = Object.entries(rechargeDistributionData).map(([operator, amount]) => ({
            name: operator,
            value: amount,
            percentage: ((amount / Object.values(rechargeDistributionData).reduce((sum, val) => sum + val, 0)) * 100).toFixed(1)
        }));

        // Process cumulative consumption trend
        const cumulativeData = sortedMonthly.map((item, index, array) => ({
            month: formatMonth(item.month),
            cumulativeKWh: array.slice(0, index + 1).reduce((sum, m) => sum + (m.consumedUnit || 0), 0),
            cumulativeBDT: array.slice(0, index + 1).reduce((sum, m) => sum + m.consumedTaka, 0)
        }));



        // Process consumption distribution for box plot
        const consumptionValues = data.dailyConsumption.map(d => d.consumedUnit).sort((a, b) => a - b);
        const boxPlotData = consumptionValues.length > 0 ? {
            min: consumptionValues[0],
            q1: consumptionValues[Math.floor(consumptionValues.length * 0.25)],
            median: consumptionValues[Math.floor(consumptionValues.length * 0.5)],
            q3: consumptionValues[Math.floor(consumptionValues.length * 0.75)],
            max: consumptionValues[consumptionValues.length - 1]
        } : null;

        // Process monthly cost trend data
        const monthlyCostData = sortedMonthly.map(item => ({
            month: formatMonth(item.month),
            'Monthly Cost (BDT)': item.consumedTaka
        }));

        // Process gauge chart data
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


    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center h-full"><Spinner size="w-12 h-12" /></div>;
        if (error) return <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>;
        
        return (
            <div className="space-y-6">
                 {isAiAvailable && (
                    <Section title="AI-Powered Insights" defaultOpen>
                        {isAiLoading ? (
                             <div className="flex items-center gap-3 text-slate-400">
                                 <Spinner size="w-6 h-6" color="border-slate-400" />
                                 <span>Generating your personalized summary...</span>
                             </div>
                        ) : !data?.aiSummary ? (
                             <div className="text-slate-400">Could not generate AI summary.</div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-start gap-4">
                                    <WandSparklesIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2">{data.aiSummary.title}</h3>
                                        <p className="text-slate-300 mb-4">{data.aiSummary.overallSummary}</p>
                                    </div>
                                </div>

                                {/* 1. Balance Status and Advice - HIGHEST PRIORITY */}
                                <div className={`rounded-lg p-4 border-l-4 ${
                                    data.aiSummary.balanceStatusAndAdvice.status === 'low' ? 'bg-red-500/10 border-red-500/20 border-l-red-400' :
                                    data.aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'bg-yellow-500/10 border-yellow-500/20 border-l-yellow-400' :
                                    'bg-green-500/10 border-green-500/20 border-l-green-400'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                            data.aiSummary.balanceStatusAndAdvice.status === 'low' ? 'bg-red-400' :
                                            data.aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'bg-yellow-400' :
                                            'bg-green-400'
                                        }`}></div>
                                        <div>
                                            <h4 className={`font-semibold mb-1 ${
                                                data.aiSummary.balanceStatusAndAdvice.status === 'low' ? 'text-red-400' :
                                                data.aiSummary.balanceStatusAndAdvice.status === 'normal' ? 'text-yellow-400' :
                                                'text-green-400'
                                            }`}>
                                                Balance Status: {data.aiSummary.balanceStatusAndAdvice.status.charAt(0).toUpperCase() + data.aiSummary.balanceStatusAndAdvice.status.slice(1)}
                                            </h4>
                                            <p className="text-sm text-slate-300">{data.aiSummary.balanceStatusAndAdvice.details}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Suggested Recharge Amount - HIGH PRIORITY */}
                                {data.aiSummary.suggestedRechargeAmount.amountBDT && (
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-semibold text-cyan-400 mb-1">💰 Recommended Recharge</h4>
                                                <p className="text-2xl font-bold text-cyan-300 mb-2">৳{data.aiSummary.suggestedRechargeAmount.amountBDT.toLocaleString()}</p>
                                                <p className="text-sm text-cyan-300">{data.aiSummary.suggestedRechargeAmount.justification}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Recharge Timing Insight - HIGH PRIORITY */}
                                <div className="bg-indigo-500/10 border border-indigo-500/20 border-l-4 border-l-indigo-400 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <h4 className="font-semibold text-indigo-400 mb-1">⏰ Optimal Recharge Timing</h4>
                                            <p className="text-sm text-indigo-300">{data.aiSummary.rechargeTimingInsight}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Anomaly Alert - MEDIUM PRIORITY */}
                                {data.aiSummary.anomaly.detected && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-semibold text-amber-400 mb-1">⚠️ Anomaly Detected</h4>
                                                <p className="text-sm text-amber-300">{data.aiSummary.anomaly.details}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 5. Seasonal Trend - MEDIUM PRIORITY */}
                                {data.aiSummary.seasonalTrend.observed && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-semibold text-blue-400 mb-1">🌡️ Seasonal Pattern</h4>
                                                <p className="text-sm text-blue-300">{data.aiSummary.seasonalTrend.details}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 6. Recharge Pattern Insight - LOWER PRIORITY */}
                                <div className="bg-slate-700/30 rounded-lg p-4">
                                    <h4 className="font-semibold text-slate-200 mb-2">📊 Recharge Pattern Analysis</h4>
                                    <p className="text-sm text-slate-300">{data.aiSummary.rechargePatternInsight}</p>
                                </div>

                                {/* 7. Actionable Tip - SUMMARY */}
                                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <h4 className="font-semibold text-purple-400 mb-1">💡 Actionable Tip</h4>
                                            <p className="text-sm text-purple-300">{data.aiSummary.actionableTip}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>
                 )}
                
                <Section title="Account Balance Status" defaultOpen>
                    {processedData?.gaugeData ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col items-center justify-center p-6 bg-slate-700/50 rounded-xl">
                                <div className="relative w-32 h-32 mb-4">
                                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="54"
                                            stroke="#374151"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="54"
                                            stroke={processedData.gaugeData.percentage > 50 ? "#22c55e" : processedData.gaugeData.percentage > 25 ? "#f59e0b" : "#ef4444"}
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 54}`}
                                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - processedData.gaugeData.percentage / 100)}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">{processedData.gaugeData.percentage.toFixed(0)}%</div>
                                            <div className="text-sm text-slate-400">of monthly avg</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-cyan-400">৳{processedData.gaugeData.currentBalance.toLocaleString()}</div>
                                    <div className="text-sm text-slate-400">Current Balance</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h5 className="text-sm font-semibold text-slate-300 mb-2">Average Monthly Cost</h5>
                                    <div className="text-xl font-bold text-orange-400">৳{processedData.gaugeData.averageMonthlyCost.toFixed(0)}</div>
                                </div>
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h5 className="text-sm font-semibold text-slate-300 mb-2">Estimated Days Remaining</h5>
                                    <div className="text-xl font-bold text-green-400">{processedData.gaugeData.daysRemaining} days</div>
                                </div>
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h5 className="text-sm font-semibold text-slate-300 mb-2">Status</h5>
                                    <div className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
                                        processedData.gaugeData.percentage > 50 ? 'bg-green-500/20 text-green-300' :
                                        processedData.gaugeData.percentage > 25 ? 'bg-yellow-500/20 text-yellow-300' :
                                        'bg-red-500/20 text-red-300'
                                    }`}>
                                        {processedData.gaugeData.percentage > 50 ? 'Good' : 
                                         processedData.gaugeData.percentage > 25 ? 'Warning' : 'Low'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">Balance data not available.</p>
                    )}
                </Section>

                <Section title="Consumption Overview" defaultOpen>
                    {processedData?.consumptionChartData && processedData.consumptionChartData.length > 0 ? (
                        <>
                        <div className="flex justify-end mb-4">
                             <div className="bg-slate-700 p-1 rounded-lg text-sm font-semibold">
                                 <button onClick={() => setConsumptionTimeframe('daily')} className={`px-3 py-1 rounded-md transition ${consumptionTimeframe === 'daily' ? 'bg-cyan-500 text-white' : 'text-slate-300'}`}>Last 30 Days</button>
                                 <button onClick={() => setConsumptionTimeframe('monthly')} className={`px-3 py-1 rounded-md transition ${consumptionTimeframe === 'monthly' ? 'bg-cyan-500 text-white' : 'text-slate-300'}`}>Last 12 Months</button>
                             </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer>
                                <LineChart data={processedData.consumptionChartData} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
                                    <YAxis yAxisId="left" tick={{ fill: '#fb923c' }} stroke="#f97316" label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#fb923c', dx: -10 }}/>
                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22d3ee' }} stroke="#06b6d4" label={{ value: 'BDT', angle: -90, position: 'insideRight', fill: '#22d3ee', dx: 10 }}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="kWh" stroke="#fb923c" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
                                    <Line yAxisId="right" type="monotone" dataKey="BDT" stroke="#22d3ee" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        </>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No consumption data available for this period.</p>
                    )}
                 </Section>

                <Section title="Recharge vs. Consumption (Last 12 Months)" defaultOpen>
                    {processedData?.rechargeVsConsumptionData && processedData.rechargeVsConsumptionData.length > 0 ? (
                        <div className="h-96 w-full">
                             <ResponsiveContainer>
                                <BarChart data={processedData.rechargeVsConsumptionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
                                    <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
                                    <Bar dataKey="Recharge" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Consumption" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No data available for this period.</p>
                    )}
                 </Section>

                <Section title="Year-over-Year Monthly Comparison" defaultOpen>
                    {processedData?.comparisonData && processedData.comparisonData.length > 0 ? (
                        <>
                        <div className="flex justify-end mb-4">
                            <div className="bg-slate-700 p-1 rounded-lg text-sm font-semibold">
                                <button onClick={() => setComparisonMetric('bdt')} className={`px-3 py-1 rounded-md transition ${comparisonMetric === 'bdt' ? 'bg-cyan-500 text-white' : 'text-slate-300'}`}>BDT</button>
                                <button onClick={() => setComparisonMetric('kwh')} className={`px-3 py-1 rounded-md transition ${comparisonMetric === 'kwh' ? 'bg-cyan-500 text-white' : 'text-slate-300'}`}>kWh</button>
                            </div>
                        </div>
                         <div className="h-96 w-full">
                            <ResponsiveContainer>
                                <BarChart data={processedData.comparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
                                    <YAxis type="category" dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} width={80} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
                                    <Bar dataKey="Previous Year" fill="#475569" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="Current Year" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        </>
                    ) : (
                        <p className="text-slate-400 text-center py-4">Not enough data for year-over-year comparison.</p>
                    )}
                </Section>

                <Section title="Consumer Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                        {[
                            { label: "Account No", value: account.accountNo }, { label: "Meter No", value: account.meterNo },
                            { label: "Customer Name", value: account.customerName }, { label: "Contact No", value: account.contactNo },
                            { label: "Tariff", value: account.tariffSolution }, { label: "Sanction Load", value: `${account.sanctionLoad} kW` },
                            { label: "Location", value: `${data?.location?.zone || ''} / ${data?.location?.block || ''}` },
                            { label: "Address", value: account.installationAddress, fullWidth: true },
                        ].map(item => (
                            <div key={item.label} className={item.fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}>
                                <p className="text-slate-400">{item.label}</p>
                                <p className="font-semibold text-slate-100">{item.value}</p>
                            </div>
                        ))}
                    </div>

                </Section>
                
                <Section title="Recharge Distribution by Operator" defaultOpen>
                    {processedData?.pieChartData && processedData.pieChartData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-80 w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={processedData.pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {processedData.pieChartData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={['#22d3ee', '#f97316', '#22c55e', '#a855f7', '#f59e0b', '#ef4444'][index % 6]} 
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-700/80 backdrop-blur-sm p-3 rounded-md border border-slate-600 shadow-lg text-sm">
                                                            <p className="font-bold text-cyan-300 mb-2">{data.name}</p>
                                                            <p className="text-white">Amount: ৳{data.value.toLocaleString()}</p>
                                                            <p className="text-slate-300">Percentage: {data.percentage}%</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-100 mb-3">Recharge Summary</h4>
                                    <div className="space-y-2">
                                        {processedData.pieChartData.map((item, index) => (
                                            <div key={item.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-4 h-4 rounded-full" 
                                                        style={{ backgroundColor: ['#22d3ee', '#f97316', '#22c55e', '#a855f7', '#f59e0b', '#ef4444'][index % 6] }}
                                                    ></div>
                                                    <span className="text-slate-200 font-medium">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-white font-semibold">৳{item.value.toLocaleString()}</div>
                                                    <div className="text-slate-400 text-sm">{item.percentage}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h5 className="text-sm font-semibold text-slate-300 mb-2">Total Recharge Amount</h5>
                                    <div className="text-2xl font-bold text-cyan-400">
                                        ৳{processedData.pieChartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No recharge data available for this period.</p>
                    )}
                </Section>
                

                 
                 <Section title="Monthly Maximum Demand (Last 12 Months)">
                    {processedData?.maxDemandData && processedData.maxDemandData.length > 0 ? (
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                 <LineChart data={processedData.maxDemandData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
                                    <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" domain={['auto', 'auto']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="Max Demand (kW)" stroke="#a855f7" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No maximum demand data available for this period.</p>
                    )}
                 </Section>

                <Section title="Cumulative Consumption Trend" defaultOpen>
                    {processedData?.cumulativeData && processedData.cumulativeData.length > 0 ? (
                        <div className="h-80 w-full">
                            <ResponsiveContainer>
                                <AreaChart data={processedData.cumulativeData} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
                                    <YAxis yAxisId="left" tick={{ fill: '#fb923c' }} stroke="#f97316" label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#fb923c', dx: -10 }}/>
                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22d3ee' }} stroke="#06b6d4" label={{ value: 'BDT', angle: -90, position: 'insideRight', fill: '#22d3ee', dx: 10 }}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
                                    <Area yAxisId="left" type="monotone" dataKey="cumulativeKWh" stroke="#fb923c" fill="#fb923c" fillOpacity={0.3} />
                                    <Area yAxisId="right" type="monotone" dataKey="cumulativeBDT" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No cumulative data available.</p>
                    )}
                </Section>



                <Section title="Daily Consumption Distribution" defaultOpen>
                    {processedData?.boxPlotData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-slate-100">Statistical Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">Minimum</span>
                                        <span className="text-white font-semibold">{processedData.boxPlotData.min} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">25th Percentile</span>
                                        <span className="text-white font-semibold">{processedData.boxPlotData.q1} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">Median</span>
                                        <span className="text-white font-semibold">{processedData.boxPlotData.median} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">75th Percentile</span>
                                        <span className="text-white font-semibold">{processedData.boxPlotData.q3} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">Maximum</span>
                                        <span className="text-white font-semibold">{processedData.boxPlotData.max} kWh</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="w-full max-w-md">
                                    <div className="relative h-32 bg-slate-700/30 rounded-lg p-4">
                                        <div className="absolute inset-4 flex items-center">
                                            <div className="w-full h-8 bg-slate-600 rounded relative">
                                                <div className="absolute left-0 top-0 h-full w-1 bg-red-400"></div>
                                                <div className="absolute left-1/4 top-0 h-full w-1 bg-yellow-400"></div>
                                                <div className="absolute left-1/2 top-0 h-full w-1 bg-green-400"></div>
                                                <div className="absolute left-3/4 top-0 h-full w-1 bg-yellow-400"></div>
                                                <div className="absolute right-0 top-0 h-full w-1 bg-red-400"></div>
                                                <div className="absolute left-0 top-0 h-full w-1 bg-slate-400 opacity-50"></div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-4">
                                            <span>Min</span>
                                            <span>Q1</span>
                                            <span>Median</span>
                                            <span>Q3</span>
                                            <span>Max</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No consumption distribution data available.</p>
                    )}
                </Section>

                <Section title="Monthly Cost Trend" defaultOpen>
                    {processedData?.monthlyCostData && processedData.monthlyCostData.length > 0 ? (
                        <div className="h-80 w-full">
                            <ResponsiveContainer>
                                <LineChart data={processedData.monthlyCostData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} stroke="#4b5563" fontSize={12} />
                                    <YAxis tick={{ fill: '#9ca3af' }} stroke="#4b5563" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="Monthly Cost (BDT)" stroke="#f97316" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-4">No monthly cost data available.</p>
                    )}
                </Section>

                <Section title="Recharge History" defaultOpen>
                    <div className="flex flex-wrap justify-end items-center gap-4 mb-4">
                        <select
                            value={rechargeYear}
                            onChange={e => handleYearChange(parseInt(e.target.value))}
                            disabled={isHistoryLoading}
                            className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
                        >
                           {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                             <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Amount (BDT)</th>
                                    <th scope="col" className="px-6 py-3">Operator</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isHistoryLoading ? (
                                    <tr><td colSpan={4} className="text-center py-8"><Spinner/></td></tr>
                                ) : data?.rechargeHistory && data.rechargeHistory.length > 0 ? data.rechargeHistory.map((item) => (
                                    <tr key={item.orderID} className="border-b border-slate-700 hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(item.rechargeDate).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-white">{item.totalAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4">{item.rechargeOperator}</td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.orderStatus === 'Execution Successful' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {item.orderStatus}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">No recharge history found for {rechargeYear}.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-40 bg-slate-900 text-slate-100 flex flex-col animate-fade-in">
            {notification && (
                <div className="fixed top-5 left-1/2 z-[60] bg-green-600 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in-down">
                    {notification}
                </div>
            )}
            <header className="flex-shrink-0 bg-slate-800/70 backdrop-blur-lg p-4 sm:p-5 flex justify-between items-center border-b border-slate-700 sticky top-0">
                <div className="flex items-center gap-4 min-w-0">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h3 className="text-xl sm:text-2xl font-bold truncate">{account.displayName || `Account ${account.accountNo}`}</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setPortalConfirmation({ isOpen: true })}
                      className="flex items-center gap-2 bg-cyan-500/80 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-200"
                      title="Copy account ID and open official DESCO customer portal"
                    >
                      <BuildingOfficeIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Official Portal</span>
                    </button>
                    <button 
                      onClick={() => onDelete(account.accountNo)}
                      className="flex items-center gap-2 bg-red-500/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-200"
                      title="Delete this account"
                    >
                      <TrashIcon />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                </div>
            </header>
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderContent()}
            </main>
            <ConfirmationDialog
                isOpen={portalConfirmation.isOpen}
                onClose={() => setPortalConfirmation({ isOpen: false })}
                onConfirm={handleOpenPortal}
                title="Open Official DESCO Portal"
                message={`This will copy your account ID "${account.accountNo}" to the clipboard and open the official DESCO customer portal in a new tab. You can then paste your account ID to log in.`}
                confirmText="Copy & Open Portal"
                cancelText="Cancel"
                confirmButtonClass="bg-cyan-600 hover:bg-cyan-700"
                icon={<BuildingOfficeIcon className="w-6 h-6" />}
            />
        </div>
    );
};

export default AccountDashboardView;