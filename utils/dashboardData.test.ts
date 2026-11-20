import { describe, expect, it } from 'vitest';
import { getDashboardDataIssues } from './dashboardData';

describe('getDashboardDataIssues', () => {
  it('reports only the failed dashboard sections', () => {
    const issues = getDashboardDataIssues({
      location: { status: 'rejected', reason: new Error('500') },
      monthlyConsumption: { status: 'fulfilled', value: [] },
      rechargeHistory: { status: 'fulfilled', value: [] },
      dailyConsumption: { status: 'rejected', reason: new Error('timeout') },
      balance: { status: 'fulfilled', value: { success: true } },
    });

    expect(issues).toEqual([
      { key: 'location', label: 'Consumer location' },
      { key: 'dailyConsumption', label: 'Daily consumption' },
    ]);
  });
});
