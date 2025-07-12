// Centralized dashboard labels for English and Bangla

const dashboardLabels = {
  balance: {
    en: 'Balance',
    bn: 'ব্যালেন্স',
  },
  currentMonthConsumption: {
    en: 'Current Month Consumption',
    bn: 'চলতি মাসের ব্যবহার',
  },
  readingTime: {
    en: 'Last Reading Time',
    bn: 'সর্বশেষ রিডিং সময়',
  },
  rechargeHistory: {
    en: 'Recharge History',
    bn: 'রিচার্জ ইতিহাস',
  },
  monthlyCostTrend: {
    en: 'Monthly Cost Trend',
    bn: 'মাসিক খরচের প্রবণতা',
  },
  maxDemand: {
    en: 'Maximum Demand',
    bn: 'সর্বাধিক চাহিদা',
  },
  aiInsights: {
    en: 'AI Insights',
    bn: 'এআই বিশ্লেষণ',
  },
  comparison: {
    en: 'Comparison',
    bn: 'তুলনা',
  },
  rechargeDistribution: {
    en: 'Recharge Distribution',
    bn: 'রিচার্জ বণ্টন',
  },
  cumulativeConsumption: {
    en: 'Cumulative Consumption',
    bn: 'মোট ব্যবহার',
  },
  consumptionChart: {
    en: 'Consumption Chart',
    bn: 'ব্যবহার চার্ট',
  },
  energyConsumption: {
    en: 'Energy Consumption',
    bn: 'শক্তি ব্যবহার',
  },
  costComparison: {
    en: 'Cost Comparison',
    bn: 'খরচ তুলনা',
  },
  totalEnergy: {
    en: 'Total Energy',
    bn: 'মোট শক্তি',
  },
  totalCost: {
    en: 'Total Cost',
    bn: 'মোট খরচ',
  },
  status: {
    en: 'Status',
    bn: 'অবস্থা',
  },
  // Time range options
  timeRange: {
    en: 'Time Range',
    bn: 'সময়কাল',
  },
  last7Days: {
    en: 'Last 7 Days',
    bn: 'গত ৭ দিন',
  },
  thisMonth: {
    en: 'This Month',
    bn: 'এই মাস',
  },
  last30Days: {
    en: 'Last 30 Days',
    bn: 'গত ৩০ দিন',
  },
  last6Months: {
    en: 'Last 6 Months',
    bn: 'গত ৬ মাস',
  },
  last1Year: {
    en: 'Last 1 Year',
    bn: 'গত ১ বছর',
  },
  last2Years: {
    en: 'Last 2 Years',
    bn: 'গত ২ বছর',
  },
  // Add more labels as needed
};

export function getDashboardLabel(key: keyof typeof dashboardLabels, banglaEnabled: boolean): string {
  const label = dashboardLabels[key];
  if (!label) return key;
  return banglaEnabled ? label.bn : label.en;
}

export default dashboardLabels; 