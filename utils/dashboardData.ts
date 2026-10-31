export type DashboardDataKey = 'location' | 'monthlyConsumption' | 'rechargeHistory' | 'dailyConsumption' | 'balance';

export type DashboardDataIssue = {
  key: DashboardDataKey;
  label: string;
};

export const getDashboardDataIssues = (
  results: Record<DashboardDataKey, PromiseSettledResult<unknown>>
): DashboardDataIssue[] => {
  const labels: Record<DashboardDataKey, string> = {
    location: 'Consumer location',
    monthlyConsumption: 'Monthly consumption',
    rechargeHistory: 'Recharge history',
    dailyConsumption: 'Daily consumption',
    balance: 'Account balance',
  };

  return (Object.keys(labels) as DashboardDataKey[])
    .filter(key => results[key]?.status === 'rejected')
    .map(key => ({ key, label: labels[key] }));
};
