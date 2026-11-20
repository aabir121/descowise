export type AccountListState = 'loading' | 'empty' | 'ready';

export const getAccountListState = (isLoading: boolean, accounts: Array<unknown>): AccountListState => {
 if (isLoading) return 'loading';
 return accounts.length > 0 ? 'ready' : 'empty';
};
