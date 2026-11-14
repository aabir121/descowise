import type { Account } from '../types';

type LinkedAccountView = Partial<Account> & Pick<Account, 'accountNo' | 'meterNo'>;
type AccountPreference = Partial<Account> & { order?: number };

export function mergeLinkedAccounts(
  server: LinkedAccountView[],
  preferences: Record<string, AccountPreference>,
  previous: Account[]
): Account[] {
  const previousById = new Map(previous.filter(account => account.accountId).map(account => [account.accountId, account]));

  return server.map(linked => {
    const prior = linked.accountId ? previousById.get(linked.accountId) : undefined;
    return {
      customerName: '', contactNo: '', feederName: '', installationAddress: '',
      tariffSolution: '', sanctionLoad: '', dateAdded: '', aiInsightsEnabled: true,
      banglaEnabled: false,
      ...(prior ? {
        balance: prior.balance,
        readingTime: prior.readingTime,
        currentMonthConsumption: prior.currentMonthConsumption
      } : {}),
      ...preferences[linked.accountNo],
      ...linked
    } as Account;
  }).sort((a, b) => (preferences[a.accountNo]?.order ?? 999) - (preferences[b.accountNo]?.order ?? 999));
}
