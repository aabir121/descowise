import { useState, useEffect, useCallback } from 'react';
import { Account } from '../types';

const STORAGE_KEY = 'desco_accounts';

export const useAccounts = () => {
    // 1. Use lazy initializer to read from localStorage only on the initial render.
    const [accounts, setAccounts] = useState<Account[]>(() => {
        try {
            const storedAccounts = localStorage.getItem(STORAGE_KEY);
            return storedAccounts ? JSON.parse(storedAccounts) : [];
        } catch (error) {
            console.error('Failed to load accounts from localStorage', error);
            return [];
        }
    });

    // 2. Use a single useEffect to sync state TO localStorage whenever the state changes.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
        } catch (error) {
            console.error('Failed to save accounts to localStorage', error);
        }
    }, [accounts]);

    // 3. Define stable update functions using the functional form of setState.
    // This prevents stale closure issues by always getting the latest state.
    const addAccount = useCallback((newAccount: Account) => {
        setAccounts(prevAccounts => {
            // Prevent adding duplicates
            if (prevAccounts.some(acc => acc.accountNo === newAccount.accountNo)) {
                return prevAccounts;
            }
            return [...prevAccounts, newAccount];
        });
    }, []);

    const deleteAccount = useCallback((accountNo: string) => {
        setAccounts(prevAccounts => prevAccounts.filter(acc => acc.accountNo !== accountNo));
    }, []);

    const updateAccount = useCallback((accountNo: string, updatedData: Partial<Account>) => {
        setAccounts(prevAccounts => 
            prevAccounts.map(acc => 
                acc.accountNo === accountNo ? { ...acc, ...updatedData } : acc
            )
        );
    }, []);

    return { accounts, addAccount, deleteAccount, updateAccount };
};
