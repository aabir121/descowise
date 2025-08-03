import React, { useState, useCallback, useEffect, useRef, Suspense, lazy, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Account } from './types';
import { useAccounts } from './hooks/useAccounts';
import { getAccountBalance, verifyAccount } from './services/descoService';
import { useIntelligentPreloader, preloadCriticalResources, addResourceHints, registerServiceWorker } from './utils/preloadStrategies';
import ErrorBoundary from './components/common/ErrorBoundary';
import AccountCard from './components/AccountCard';
import AddAccountCard from './components/AddAccountCard';
import AddAccountModal from './components/AddAccountModal';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import { BoltIcon, ExclamationTriangleIcon, TrashIcon, PlusIcon, InformationCircleIcon, BellIcon } from './components/common/Icons';
import Notification from './components/common/Notification';
import FloatingInfoButton from './components/FloatingInfoButton';
import Footer from './components/common/Footer';
import BalanceInfoWarningModal from './components/common/BalanceInfoWarningModal';
import { useBalanceWarning } from './hooks/useBalanceWarning';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import OnboardingModal from './components/OnboardingModal';
import ApiKeyManagementModal from './components/ApiKeyManagementModal';
import ApiKeyStatusIndicator from './components/common/ApiKeyStatusIndicator';
import HelpModal from './components/common/HelpModal';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { notificationService } from './services/notificationService';

// Global Modal Component - moved here to stay on top of everything
interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = '', ...props }) => {
  // Handle escape key and prevent zoom issues
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Prevent zoom issues on mobile
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';

      // Reset viewport on modal close to prevent zoom issues
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      // Force a repaint to ensure zoom is reset
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          window.scrollTo(0, window.scrollY);
        }, 100);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render modal at document root level using portal
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] mx-4 sm:mx-auto my-8 text-slate-100 relative transform flex flex-col ${className}`}
        style={{overflow: 'hidden'}}
        onClick={e => e.stopPropagation()}
        {...props}
      >
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Modal Context for global access
const ModalContext = createContext<React.FC<ModalProps> | null>(null);

export const useModal = () => {
  const modal = useContext(ModalContext);
  if (!modal) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return modal;
};

// Lazy load the heavy dashboard component
const AccountDashboardView = lazy(() => import('./components/AccountDashboardView'));

const DashboardWrapper: React.FC<{ accounts: Account[]; showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void; onDelete: (accountNo: string) => void; sharedViewerMode: boolean; }> = ({ accounts, showNotification, onDelete, sharedViewerMode }) => {
    const { accountNo } = useParams<{ accountNo: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const selectedAccount = accounts.find(acc => acc.accountNo === accountNo);

    // Check if this is a shared link
    const params = new URLSearchParams(location.search);
    const isSharedLink = params.get('shared') === '1';

    if (!selectedAccount) {
        // If account not found and it's a shared link in viewer mode, create a temporary account
        if (isSharedLink && sharedViewerMode && accountNo) {
            const tempAccount: Account = {
                accountNo: accountNo,
                customerName: 'Shared Account',
                contactNo: '',
                feederName: '',
                installationAddress: '',
                meterNo: '',
                tariffSolution: '',
                sanctionLoad: '',
                dateAdded: new Date().toISOString(),
                aiInsightsEnabled: false,
                banglaEnabled: false,
                displayName: null
            };

            return (
                <Suspense fallback={
                    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                            <p className="text-slate-300">Loading dashboard...</p>
                        </div>
                    </div>
                }>
                    <AccountDashboardView
                        account={tempAccount}
                        onClose={() => navigate("/", { replace: true })}
                        onDelete={() => {}} // Disable delete for view-only mode
                        showNotification={showNotification}
                    />
                </Suspense>
            );
        }

        // If account not found and it's a shared link but not in viewer mode, show loading
        if (isSharedLink) {
            // Return a placeholder or loading state while shared link logic processes
            return (
                <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                        <p className="text-slate-300">Processing shared link...</p>
                    </div>
                </div>
            );
        }
        // If account not found and not a shared link, redirect to home
        return <Navigate to="/" replace />;
    }
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-slate-300">Loading dashboard...</p>
                </div>
            </div>
        }>
            <AccountDashboardView
                account={selectedAccount}
                onClose={() => navigate("/", { replace: true })}
                onDelete={onDelete}
                showNotification={showNotification}
            />
        </Suspense>
    );
};

const AccountListPage: React.FC<{
  accounts: Account[];
  loadingBalances: Set<string>;
  updateAccount: (accountNo: string, data: Partial<Account>) => void;
  handleDeleteAccount: (accountNo: string) => void;
  setAddAccountModalOpen: (open: boolean) => void;
  addAccountModalOpen: boolean;
  handleAccountAdded: (newAccount: Account) => void;
  notification: { message: string; type: 'info' | 'warning' | 'error' } | null;
  showDataNotice: boolean | null;
  handleDismissDataNotice: () => void;
  t: any;
  TrashIcon: any;
  PlusIcon: any;
  LanguageSwitcher: any;
  BoltIcon: any;
  Footer: any;
  setIsApiKeyModalOpen: (open: boolean) => void;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  isNotificationSettingsOpen: boolean;
  setIsNotificationSettingsOpen: (open: boolean) => void;
  apiKeyConfiguredStatus: any;
}> = ({
  accounts,
  loadingBalances,
  updateAccount,
  handleDeleteAccount,
  setAddAccountModalOpen,
  addAccountModalOpen,
  handleAccountAdded,
  notification,
  showDataNotice,
  handleDismissDataNotice,
  t,
  TrashIcon,
  PlusIcon,
  LanguageSwitcher,
  BoltIcon,
  Footer,
  setIsApiKeyModalOpen,
  isHelpModalOpen,
  setIsHelpModalOpen,
  isNotificationSettingsOpen,
  setIsNotificationSettingsOpen,
  apiKeyConfiguredStatus
}) => {
  const navigate = useNavigate();
  const handleSelectAccount = useCallback((accountNo: string) => {
    navigate(`/dashboard/${accountNo}`);
  }, [navigate]);
  return (
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
        <header className="mb-6 sm:mb-12 animate-fade-in">
          {/* Header design with consistent branding */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Controls bar - always at top */}
            <div className="flex justify-around py-1">
              <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-3">
                <ApiKeyStatusIndicator
                  variant="button"
                  size="sm"
                  onClick={() => setIsApiKeyModalOpen(true)}
                  showTooltip={true}
                  showLabel={true}
                  className="hidden sm:flex"
                />
                <ApiKeyStatusIndicator
                  variant="button"
                  size="sm"
                  onClick={() => setIsApiKeyModalOpen(true)}
                  showTooltip={false}
                  showLabel={true}
                  className="flex sm:hidden text-xs font-medium"
                />
                <button
                  onClick={() => setIsNotificationSettingsOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-purple-600/80 hover:bg-purple-500 transition-colors text-white border border-purple-500/50 hover:border-purple-400/70 min-h-[2rem] sm:min-h-[2.25rem]"
                  title={t('notificationSettings')}
                >
                  <BellIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{t('notifications')}</span>
                </button>
                <button
                  onClick={() => setIsHelpModalOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 transition-colors text-white border border-blue-500/50 hover:border-blue-400/70 min-h-[2rem] sm:min-h-[2.25rem]"
                  title={t('helpAndGuidance', 'Help & Guidance')}
                >
                  <InformationCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{t('help', 'Help')}</span>
                </button>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Main branding section - always visible and centered */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                  <BoltIcon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-cyan-400"/>
                </div>
                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-50 bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text">
                  {t('appTitle')}
                </h1>
              </div>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-4xl mx-auto opacity-90 px-4 sm:px-0">
                {t('appSubtitle')}
              </p>
            </div>
          </div>
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
              <button
                onClick={() => setAddAccountModalOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                {t('addNewAccount')}
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
                  onUpdateBanglaEnabled={(accountNo, enabled) => updateAccount(accountNo, { banglaEnabled: enabled })}
                  onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                />
              ))}
              <AddAccountCard onClick={() => setAddAccountModalOpen(true)} />
            </div>
          )}
        </main>
      </div>
      <Footer />
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />
    </div>
  );
};

const App: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { accounts, addAccount, deleteAccount, updateAccount } = useAccounts();
    const [loadingBalances, setLoadingBalances] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);
    const { trackAction, preloadForRoute } = useIntelligentPreloader();

    // Initialize performance optimizations and service worker
    useEffect(() => {
        preloadCriticalResources();
        addResourceHints();
        registerServiceWorker();
    }, []);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountNo: string | null; accountName: string }>({
        isOpen: false,
        accountNo: null,
        accountName: ''
    });
    const [showDataNotice, setShowDataNotice] = useState<null | boolean>(null);
    const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
    
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

    const location = useLocation();
    const [sharedPrompt, setSharedPrompt] = useState<{ isOpen: boolean; accountNo: string | null }>({ isOpen: false, accountNo: null });
    const [sharedLoading, setSharedLoading] = useState(false);
    const [sharedError, setSharedError] = useState<string | null>(null);

    // Track route changes for intelligent preloading
    useEffect(() => {
        preloadForRoute(location.pathname);
        trackAction(`navigate_${location.pathname}`);
    }, [location.pathname, preloadForRoute, trackAction]);
    const [sharedViewerMode, setSharedViewerMode] = useState(false);
    const [pendingSharedLink, setPendingSharedLink] = useState<string | null>(null);
    const [preVerifiedAccount, setPreVerifiedAccount] = useState<{ accountNo: string; data: any } | null>(null);

    useEffect(() => {
        // Check if onboarding has been completed
        const onboardingCompleted = localStorage.getItem('onboardingCompleted');
        if (!onboardingCompleted) {
            setShowOnboarding(true);
        }

        // For testing: uncomment the line below to reset onboarding
        // localStorage.removeItem('onboardingCompleted');
    }, []);

    // Initialize notification service once on mount
    useEffect(() => {
        notificationService.initialize(accounts);
        return () => {
            // Cleanup on unmount
            notificationService.stopScheduler();
        };
    }, []); // Remove accounts dependency to prevent re-initialization

    // Update accounts in notification service when accounts change
    useEffect(() => {
        // Always update accounts, even if empty (for proper cleanup)
        notificationService.updateAccounts(accounts);
    }, [accounts]);

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

    useEffect(() => {
        // Detect shared link
        const match = location.pathname.match(/^\/dashboard\/(\d+)/);
        const params = new URLSearchParams(location.search);
        const shared = params.get('shared');
        if (match && shared === '1') {
            const accountNo = match[1];

            // Check if onboarding is completed
            const onboardingCompleted = localStorage.getItem('onboardingCompleted');

            if (!onboardingCompleted) {
                // If onboarding not completed, store the shared link for later
                setPendingSharedLink(accountNo);
                return;
            }

            // Check if account is already in the list
            const accountExists = accounts.some(acc => acc.accountNo === accountNo);

            if (accountExists) {
                // Account already exists, navigate directly to dashboard
                // The DashboardWrapper will handle showing the account
                return;
            }

            // Account doesn't exist and user is onboarded, show confirmation modal
            if (!sharedPrompt.isOpen && !sharedViewerMode) {
                setSharedPrompt({ isOpen: true, accountNo });
                setSharedError(null);
            }
        } else {
            // Reset shared prompt if navigating away
            if (sharedPrompt.isOpen) setSharedPrompt({ isOpen: false, accountNo: null });
            if (sharedViewerMode) setSharedViewerMode(false);
            setPendingSharedLink(null);
        }
    }, [location, accounts, sharedPrompt.isOpen, sharedViewerMode]);

    const handleConfirmSharedAdd = useCallback(async () => {
        if (!sharedPrompt.accountNo) return;
        setSharedLoading(true);
        setSharedError(null);
        try {
            const result = await verifyAccount(sharedPrompt.accountNo);
            if (result.success && result.data) {
                // Close the shared prompt and open AddAccountModal with pre-verified data
                setSharedPrompt({ isOpen: false, accountNo: null });
                setPreVerifiedAccount({ accountNo: sharedPrompt.accountNo, data: result.data });
                setAddAccountModalOpen(true);
            } else {
                setSharedError(result.message || 'Could not fetch account details.');
            }
        } catch (e) {
            setSharedError('Network error. Please try again.');
        } finally {
            setSharedLoading(false);
        }
    }, [sharedPrompt.accountNo, t]);

    const handleDeclineSharedAdd = useCallback(() => {
        const accountNo = sharedPrompt.accountNo;
        setSharedPrompt({ isOpen: false, accountNo: null });
        setSharedViewerMode(true);

        // Navigate to the dashboard in view-only mode
        if (accountNo) {
            navigate(`/dashboard/${accountNo}?shared=1`);
        }
    }, [sharedPrompt.accountNo, navigate]);

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
            setDeleteConfirmation({ isOpen: false, accountNo: null, accountName: '' });
        }
    }, [deleteConfirmation.accountNo, deleteAccount]);

    const handleDismissDataNotice = useCallback(() => {
        localStorage.setItem('dataNoticeDismissedAt', Date.now().toString());
        setShowDataNotice(false);
    }, []);

    const handleLanguageSelect = useCallback((language: 'en' | 'bn') => {
        i18n.changeLanguage(language);
    }, [i18n]);

    const handleCloseOnboarding = useCallback(() => {
        setShowOnboarding(false);

        // If there's a pending shared link, show the confirmation modal
        if (pendingSharedLink) {
            // Check if account is already in the list
            const accountExists = accounts.some(acc => acc.accountNo === pendingSharedLink);

            if (!accountExists) {
                // Show confirmation modal for the pending shared link
                setSharedPrompt({ isOpen: true, accountNo: pendingSharedLink });
                setSharedError(null);
            }
            setPendingSharedLink(null);
        }
    }, [pendingSharedLink, accounts]);

    return (
        <ModalContext.Provider value={Modal}>
            <ErrorBoundary>
                <Routes>
                    <Route path="/dashboard/:accountNo" element={
                        <DashboardWrapper
                            accounts={accounts}
                            showNotification={showNotification}
                            onDelete={handleDeleteFromDashboard}
                            sharedViewerMode={sharedViewerMode}
                        />
                    } />
                    <Route path="/" element={
                        <AccountListPage
                          accounts={accounts}
                          loadingBalances={loadingBalances}
                          updateAccount={updateAccount}
                          handleDeleteAccount={handleDeleteAccount}
                          setAddAccountModalOpen={setAddAccountModalOpen}
                          addAccountModalOpen={addAccountModalOpen}
                          handleAccountAdded={handleAccountAdded}
                          notification={notification}
                          showDataNotice={showDataNotice}
                          handleDismissDataNotice={handleDismissDataNotice}
                          t={t}
                          TrashIcon={TrashIcon}
                          PlusIcon={PlusIcon}
                          LanguageSwitcher={LanguageSwitcher}
                          BoltIcon={BoltIcon}
                          Footer={Footer}
                          setIsApiKeyModalOpen={setIsApiKeyModalOpen}
                          isHelpModalOpen={isHelpModalOpen}
                          setIsHelpModalOpen={setIsHelpModalOpen}
                          isNotificationSettingsOpen={isNotificationSettingsOpen}
                          setIsNotificationSettingsOpen={setIsNotificationSettingsOpen}
                        />
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>
            <AddAccountModal
                isOpen={addAccountModalOpen}
                onClose={() => {
                    setAddAccountModalOpen(false);
                    setPreVerifiedAccount(null);
                }}
                onAccountAdded={handleAccountAdded}
                existingAccounts={accounts}
                preVerifiedAccount={preVerifiedAccount}
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
            
            {/* Global Floating Info Button */}
            <FloatingInfoButton />
            
            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                onClose={handleCloseOnboarding}
                onLanguageSelect={handleLanguageSelect}
            />
            <ConfirmationDialog
                isOpen={sharedPrompt.isOpen}
                onClose={handleDeclineSharedAdd}
                onConfirm={handleConfirmSharedAdd}
                title={t('sharedAccountTitle') || 'Shared Account'}
                message={sharedError ? (sharedError) : (t('sharedAccountMessage') || 'This account was shared with you. What would you like to do?')}
                confirmText={sharedLoading ? (t('adding') || 'Adding...') : (t('addAccount') || 'Add account')}
                cancelText={t('viewOnly') || 'View only'}
                confirmButtonClass={sharedLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'}
                icon={<BoltIcon />}
            />
            <ApiKeyManagementModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                                onApiKeyUpdated={() => {
                    showNotification(t('apiKeyUpdatedSuccessfully'), 'info');
                    window.location.reload(); // Reload the page to reflect API key status change
                }}
            />
            <NotificationSettingsModal
                isOpen={isNotificationSettingsOpen}
                onClose={() => setIsNotificationSettingsOpen(false)}
            />
        </ModalContext.Provider>
    );
};

export default App;