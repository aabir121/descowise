import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Account } from './types';
import { useAccounts } from './hooks/useAccounts';
import { getAccountBalance } from './services/descoService';
import AccountCard from './components/AccountCard';
import AddAccountCard from './components/AddAccountCard';
import AddAccountModal from './components/AddAccountModal';
import AccountDashboardView from './components/AccountDashboardView';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import { BoltIcon, ExclamationTriangleIcon, TrashIcon } from './components/common/Icons';
import Notification from './components/common/Notification';
import FloatingCoffeeButton from './components/FloatingCoffeeButton';
import Footer from './components/common/Footer';
import BalanceInfoWarningModal from './components/common/BalanceInfoWarningModal';
import { useBalanceWarning } from './hooks/useBalanceWarning';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
    const { t } = useTranslation();
    const { accounts, addAccount, deleteAccount, updateAccount } = useAccounts();
    const [loadingBalances, setLoadingBalances] = useState<Set<string>>(new Set());
    const [selectedAccountNo, setSelectedAccountNo] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountNo: string | null; accountName: string }>({
        isOpen: false,
        accountNo: null,
        accountName: ''
    });
    const [showDataNotice, setShowDataNotice] = useState<null | boolean>(null);
    const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
    
    // Global balance warning modal state
    const { isOpen: isBalanceWarningOpen, close: closeBalanceWarning } = useBalanceWarning();
    
    // Ref to track if we're currently fetching balances to prevent double calls
    const isFetchingBalances = useRef(false);
    const lastAccountsLength = useRef(0);
    // Track which accounts have already been checked for balance warnings
    const checkedAccounts = useRef<Set<string>>(new Set());
    // Track if this is the initial load
    const isInitialLoad = useRef(true);

    const showNotification = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
        setNotification({ message, type });
    }, []);

    useEffect(() => {
        // Check if the notice was dismissed within the last 6 hours
        const dismissedAt = localStorage.getItem('dataNoticeDismissedAt');
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60);
            if (hoursPassed < 6) {
                setShowDataNotice(false);
                return;
            }
        }
        setShowDataNotice(true);
    }, []);

    useEffect(() => {
        // Only fetch balances if:
        // 1. We have accounts
        // 2. We're not already fetching
        // 3. The number of accounts has actually changed
        if (accounts.length > 0 && !isFetchingBalances.current && accounts.length !== lastAccountsLength.current) {
            const fetchAllBalances = async () => {
                isFetchingBalances.current = true;
                lastAccountsLength.current = accounts.length;
                setLoadingBalances(new Set(accounts.map(a => a.accountNo)));
                const accountsWithNullValues: string[] = [];
                const newlyAddedAccounts = new Set<string>();
                
                // Identify newly added accounts
                accounts.forEach(account => {
                    if (!checkedAccounts.current.has(account.accountNo)) {
                        newlyAddedAccounts.add(account.accountNo);
                    }
                });
                
                await Promise.all(accounts.map(async (account) => {
                    const result = await getAccountBalance(account.accountNo);
                    if (result.success) {
                        updateAccount(account.accountNo, { 
                            balance: result.data?.balance,
                            readingTime: result.data?.readingTime,
                            currentMonthConsumption: result.data?.currentMonthConsumption
                        });
                        
                        // Only collect accounts where balance is actually null/undefined
                        if (result.data?.balance === null || result.data?.balance === undefined) {
                            accountsWithNullValues.push(account.accountNo);
                        }
                    }
                    setLoadingBalances(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(account.accountNo);
                        return newSet;
                    });
                }));

                // Mark all accounts as checked
                accounts.forEach(account => {
                    checkedAccounts.current.add(account.accountNo);
                });

                // Show warnings based on the scenario:
                // 1. On initial load: show warnings for all accounts with null values
                // 2. On new account addition: only show warnings for newly added accounts with null values
                if (accountsWithNullValues.length > 0) {
                    let accountsToWarn: string[] = [];
                    
                    if (isInitialLoad.current) {
                        // Initial load: warn about all accounts with null values
                        accountsToWarn = accountsWithNullValues;
                        isInitialLoad.current = false;
                    } else {
                        // New account addition: only warn about newly added accounts with null values
                        accountsToWarn = accountsWithNullValues.filter(accountNo => 
                            newlyAddedAccounts.has(accountNo)
                        );
                    }
                    
                    if (accountsToWarn.length > 0) {
                        const accountList = accountsToWarn.join(', ');
                        showNotification(t('balanceWarningMessage', { accountList }), 'warning');
                    }
                }
                
                isFetchingBalances.current = false;
            };

            fetchAllBalances();
        }
    }, [accounts.length, updateAccount, showNotification]);
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Clean up checkedAccounts when accounts are deleted
    useEffect(() => {
        const currentAccountNos = new Set(accounts.map(acc => acc.accountNo));
        // Remove any account numbers from checkedAccounts that no longer exist
        checkedAccounts.current.forEach(accountNo => {
            if (!currentAccountNos.has(accountNo)) {
                checkedAccounts.current.delete(accountNo);
            }
        });
    }, [accounts]);

    const handleAccountAdded = useCallback((newAccount: Account) => {
        addAccount(newAccount);
    }, [addAccount]);
    
    const handleDeleteAccount = useCallback((accountNo: string) => {
        setDeleteConfirmation({
            isOpen: true,
            accountNo,
            accountName: accountNo
        });
    }, []);

    const handleSelectAccount = useCallback((accountNo: string) => {
        setSelectedAccountNo(accountNo);
    }, []);

    const handleCloseDashboard = useCallback(() => {
        setSelectedAccountNo(null);
    }, []);

    const handleDeleteFromDashboard = useCallback((accountNo: string) => {
        setDeleteConfirmation({
            isOpen: true,
            accountNo,
            accountName: accountNo
        });
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (deleteConfirmation.accountNo) {
            deleteAccount(deleteConfirmation.accountNo);
            setSelectedAccountNo(null);
            setDeleteConfirmation({ isOpen: false, accountNo: null, accountName: '' });
        }
    }, [deleteConfirmation.accountNo, deleteAccount]);

    const handleDismissDataNotice = useCallback(() => {
        localStorage.setItem('dataNoticeDismissedAt', Date.now().toString());
        setShowDataNotice(false);
    }, []);

    const selectedAccount = accounts.find(acc => acc.accountNo === selectedAccountNo);

    return (
        <>
            {selectedAccount ? (
                <AccountDashboardView
                    account={selectedAccount}
                    onClose={handleCloseDashboard}
                    onDelete={handleDeleteFromDashboard}
                    showNotification={showNotification}
                />
            ) : (
                <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
                    {showDataNotice === true && (
                        <div className="flex items-center justify-between bg-blue-100 text-blue-900 px-4 py-3 shadow-md w-full relative z-50" style={{ minHeight: '56px' }}>
                            <span className="text-base font-medium">
                                {t('dataUpdateNotice')}
                            </span>
                            <button
                                className="ml-4 text-blue-700 hover:text-blue-900 p-1 focus:outline-none flex-shrink-0"
                                aria-label={t('dismissNotice')}
                                onClick={handleDismissDataNotice}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {notification && (
                        <Notification message={notification.message} type={notification.type} />
                    )}
                    <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <header className="text-center mb-8 sm:mb-12 relative">
                            {/* Language Switcher - positioned absolutely in top-right */}
                            <div className="absolute top-0 right-0 z-10">
                                <LanguageSwitcher />
                            </div>
                            
                            <div className="inline-flex items-center gap-3">
                                 <BoltIcon className="w-8 h-8 text-cyan-400"/>
                                 <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-50">{t('appTitle')}</h1>
                            </div>
                            <p className="text-lg sm:text-xl text-slate-400 mt-2">{t('appSubtitle')}</p>
                        </header>

                        <main>
                            {accounts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-slate-800/50 border border-slate-700 rounded-2xl p-10 sm:p-16">
                                  {/* Friendly icon/illustration */}
                                  <div className="mb-6">
                                    <svg className="w-16 h-16 mx-auto text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                  </div>
                                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-100">{t('noAccountsTitle')}</h2>
                                  <p className="text-slate-400 mb-8 max-w-md mx-auto">{t('noAccountsSubtitle')}<br />{t('noAccountsAction')}</p>
                                  <AddAccountModal
                                    isOpen={addAccountModalOpen}
                                    onClose={() => setAddAccountModalOpen(false)}
                                    onAccountAdded={handleAccountAdded}
                                    existingAccounts={accounts}
                                  />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                                    {accounts.map(account => (
                                        <AccountCard 
                                            key={account.accountNo} 
                                            account={account} 
                                            onSelect={handleSelectAccount}
                                            onDelete={handleDeleteAccount}
                                            isBalanceLoading={loadingBalances.has(account.accountNo)}
                                            onUpdateDisplayName={(accountNo, newDisplayName) => updateAccount(accountNo, { displayName: newDisplayName })}
                                            onUpdateAiInsightsEnabled={(accountNo, enabled) => updateAccount(accountNo, { aiInsightsEnabled: enabled })}
                                            onUpdateBanglaEnabled={(accountNo, enabled) => updateAccount(accountNo, { banglaEnabled: enabled })}
                                        />
                                    ))}
                                    <AddAccountCard onClick={() => setAddAccountModalOpen(true)} />
                                </div>
                            )}
                        </main>
                    </div>
                    <Footer />
                </div>
            )}
            <AddAccountModal
                isOpen={addAccountModalOpen}
                onClose={() => setAddAccountModalOpen(false)}
                onAccountAdded={handleAccountAdded}
                existingAccounts={accounts}
            />
            <ConfirmationDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, accountNo: null, accountName: '' })}
                onConfirm={handleConfirmDelete}
                title={t('deleteAccount')}
                message={t('deleteAccountMsg', { accountNo: deleteConfirmation.accountName })}
                confirmText={t('deleteAccount')}
                cancelText={t('cancel')}
                icon={<ExclamationTriangleIcon />}
            />
            
            {/* Global Balance Info Warning Modal - Always rendered at top level */}
            <BalanceInfoWarningModal
                isOpen={isBalanceWarningOpen}
                onClose={closeBalanceWarning}
            />
            
            {/* Global Floating Buy Me a Coffee Button */}
            <FloatingCoffeeButton />
        </>
    );
};

export default App;