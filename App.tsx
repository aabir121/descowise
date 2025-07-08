import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Account } from './types';
import { useAccounts } from './hooks/useAccounts';
import { getAccountBalance } from './services/descoService';
import AccountCard from './components/AccountCard';
import AddAccountCard from './components/AddAccountCard';
import AddAccountModal from './components/AddAccountModal';
import AccountDashboardView from './components/AccountDashboardView';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import { BoltIcon, PlusIcon, ExclamationTriangleIcon, TrashIcon } from './components/common/Icons';
import Notification from './components/common/Notification';
import FloatingCoffeeButton from './components/FloatingCoffeeButton';
import Footer from './components/common/Footer';

const App: React.FC = () => {
    const { accounts, addAccount, deleteAccount, updateAccount } = useAccounts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingBalances, setLoadingBalances] = useState<Set<string>>(new Set());
    const [selectedAccountNo, setSelectedAccountNo] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountNo: string | null; accountName: string }>({
        isOpen: false,
        accountNo: null,
        accountName: ''
    });
    const [showDataNotice, setShowDataNotice] = useState<null | boolean>(null);

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
        if (accounts.length > 0) {
            const fetchAllBalances = async () => {
                setLoadingBalances(new Set(accounts.map(a => a.accountNo)));
                
                await Promise.all(accounts.map(async (account) => {
                    const result = await getAccountBalance(account.accountNo);
                    if (result.success) {
                        updateAccount(account.accountNo, { 
                            balance: result.data.balance,
                            readingTime: result.data.readingTime,
                            currentMonthConsumption: result.data.currentMonthConsumption
                        });
                    }
                    setLoadingBalances(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(account.accountNo);
                        return newSet;
                    });
                }));
            };

            fetchAllBalances();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts.length]);
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = useCallback((message: string) => {
        setNotification(message);
    }, []);

    const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    const handleAccountAdded = useCallback((newAccount: Account) => {
        addAccount(newAccount);
        setIsModalOpen(false);
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
                                Data is updated daily and shows information up to the previous day. Today’s data will be available tomorrow, according to DESCO’s schedule.
                            </span>
                            <button
                                className="ml-4 text-blue-700 hover:text-blue-900 p-1 focus:outline-none flex-shrink-0"
                                aria-label="Dismiss notice"
                                onClick={handleDismissDataNotice}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {notification && (
                        <Notification message={notification} />
                    )}
                    <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <header className="text-center mb-8 sm:mb-12">
                            <div className="inline-flex items-center gap-3">
                                 <BoltIcon className="w-8 h-8 text-cyan-400"/>
                                 <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-50">DESCO Account Manager</h1>
                            </div>
                            <p className="text-lg sm:text-xl text-slate-400 mt-2">Your electricity accounts, simplified.</p>
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
                                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-100">No Accounts Yet</h2>
                                  <p className="text-slate-400 mb-8 max-w-md mx-auto">You haven’t added any electricity accounts.<br />Click below to get started.</p>
                                  <button
                                    onClick={handleOpenModal}
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-lg shadow-lg transition focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
                                  >
                                    <span className="text-2xl">+</span>
                                    Add Account
                                  </button>
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
                                        />
                                    ))}
                                    <AddAccountCard onClick={handleOpenModal} />
                                </div>
                            )}
                        </main>
                    </div>
                    <Footer />
                </div>
            )}
            <AddAccountModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAccountAdded={handleAccountAdded}
                existingAccounts={accounts}
            />
            <ConfirmationDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, accountNo: null, accountName: '' })}
                onConfirm={handleConfirmDelete}
                title="Delete Account"
                message={`Are you sure you want to delete account "${deleteConfirmation.accountName}"? This action cannot be undone and all account data will be permanently removed.`}
                confirmText="Delete Account"
                cancelText="Cancel"
                icon={<ExclamationTriangleIcon />}
            />
            {/* Floating Buy Me a Coffee Button */}
            <div>
                <style>{`
                    .floating-coffee-btn {
                        position: fixed;
                        bottom: 2rem;
                        right: 2rem;
                        z-index: 100;
                        background: #22223b;
                        color: #f2e9e4;
                        border-radius: 50%;
                        width: 56px;
                        height: 56px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
                        cursor: pointer;
                        transition: box-shadow 0.2s, transform 0.2s;
                    }
                    .floating-coffee-btn:hover {
                        box-shadow: 0 8px 24px rgba(0,0,0,0.28);
                        transform: scale(1.08);
                    }
                    .coffee-popover {
                        position: fixed;
                        bottom: 5.5rem;
                        right: 2rem;
                        background: #262626;
                        color: #fff;
                        border-radius: 1rem;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.22);
                        padding: 1.5rem 1.25rem 1.25rem 1.25rem;
                        min-width: 260px;
                        max-width: 90vw;
                        z-index: 101;
                        animation: fade-in 0.3s cubic-bezier(0.4,0,0.2,1);
                    }
                    .coffee-popover a {
                        display: inline-block;
                        margin: 0.25rem 0.5rem 0.25rem 0;
                        text-decoration: none;
                        color: #f2e9e4;
                        font-weight: 500;
                        transition: color 0.2s;
                    }
                    .coffee-popover a:hover {
                        color: #fbbf24;
                    }
                `}</style>
                <FloatingCoffeeButton />
            </div>
        </>
    );
};

export default App;