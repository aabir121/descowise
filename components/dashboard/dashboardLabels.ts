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
  status: {
    en: 'Status',
    bn: 'অবস্থা',
  },
  // Add more labels as needed
};

export function getDashboardLabel(key: keyof typeof dashboardLabels, banglaEnabled: boolean): string {
  const label = dashboardLabels[key];
  if (!label) return key;
  return banglaEnabled ? label.bn : label.en;
}

export default dashboardLabels; 