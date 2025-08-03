import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import ConfirmationDialog from './common/ConfirmationDialog';
import { BuildingOfficeIcon, InformationCircleIcon, TrashIcon } from './common/Icons';
import useDashboardData from './dashboard/useDashboardData';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardSections from './dashboard/DashboardSections';
import Footer from './common/Footer';
import { useBalanceWarning } from '../hooks/useBalanceWarning';
import { useTranslation } from 'react-i18next';
import Notification from './common/Notification';
import { SkeletonDashboard, FadeTransition } from './common/SkeletonComponents';
import ApiKeyManagementModal from './ApiKeyManagementModal';

// Helper function to calculate data staleness
function getDataStalenessInfo(readingTime?: string, t?: any, daysBehindPlural?: string): { isStale: boolean; message: string } {
    if (!readingTime) return { isStale: false, message: '' };
    
    const latestDate = new Date(readingTime).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const daysBehind = Math.floor((new Date(today).getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysBehind > 0) {
        const plural = daysBehind > 1 ? 's' : '';
        const message = t
            ? t('lastUpdatedAgo', { date: latestDate, days: daysBehind, plural })
            : `Last updated ${latestDate} (${daysBehind} day${plural} ago)`;
        return { isStale: true, message };
    } else {
        const message = t
            ? t('lastUpdated', { date: latestDate })
            : `Last updated: ${latestDate}`;
        return { isStale: false, message };
    }
}

const AccountDashboardView: React.FC<{ account: Account; onClose: () => void; onDelete: (accountNo: string) => void; showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void; }> = ({ account, onClose, onDelete, showNotification }) => {
    const { t, i18n } = useTranslation();
    const { open: openBalanceWarning } = useBalanceWarning();
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const {
        processedData,
        isLoading,
        error,
        isAiLoading,
        isAiAvailable,
        rechargeYear,
        isHistoryLoading,
        consumptionTimeRange,
        setConsumptionTimeRange,
        comparisonMetric,
        setComparisonMetric,
        portalConfirmation,
        setPortalConfirmation,
        deleteConfirmation,
        setDeleteConfirmation,
        handleOpenPortal,
        handleDeleteAccount,
        handleYearChange,
        data,
        retryAiSummary,
        forceRefreshAiSummary,
        // New distributed AI insights
        distributedAiInsights,
        aiLoadingStates,
        // AI Cache information
        isUsingCache,
        cacheStatus,
    } = useDashboardData(account);

    // Add notification state for dashboard view
    const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);

    // Calculate data staleness
    const stalenessInfo = getDataStalenessInfo(data?.balance?.readingTime, t);

    // Override showNotification to also set local notification state
    const handleShowNotification = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
        setNotification({ message, type });
        // Also call the parent showNotification for consistency
        showNotification(message, type);
    }, [showNotification]);

    // Auto-hide notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <div className="fixed inset-0 z-40 bg-slate-900 text-slate-100 flex flex-col animate-fade-in">
            {/* Show notification in dashboard view */}
            {notification && (
                <Notification message={notification.message} type={notification.type} />
            )}
            <DashboardHeader
                account={account}
                onClose={onClose}
                onDelete={handleDeleteAccount}
                setPortalConfirmation={setPortalConfirmation}
                onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                isUsingCache={isUsingCache}
                cacheStatus={cacheStatus}
                onForceRefreshAi={forceRefreshAiSummary}
                isAiLoading={isAiLoading}
            />
            {/* As of date display */}
            {data?.balance?.readingTime && (
                <div className="text-xs text-slate-400 text-right px-4 sm:px-6 lg:px-8 mt-1 mb-2">
                    {stalenessInfo.message}
                </div>
            )}
            {/* Show notification if balance data is null */}
            {data?.balance && (data.balance.balance === null || data.balance.balance === undefined) && (
                <div className="flex items-center justify-between max-w-md mx-auto bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-2 rounded-md text-sm mb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{t('balanceUnavailable')}</span>
                        <button
                            onClick={openBalanceWarning}
                            className="p-1 rounded hover:bg-yellow-100 focus:outline-none"
                            aria-label={t('moreInfoUnavailableBalance')}
                        >
                            <InformationCircleIcon className="w-4 h-4 text-yellow-600 hover:text-yellow-700" />
                        </button>
                    </div>
                </div>
            )}
            <main className="flex-grow px-4 pt-2 pb-4 sm:px-6 sm:pt-2 sm:pb-6 lg:px-8 lg:pt-2 lg:pb-8 overflow-y-auto">
                <div className="relative min-h-full">
                    {/* Skeleton Dashboard with fade out transition */}
                    <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                        isLoading ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none hidden'
                    }`}>
                        <SkeletonDashboard />
                    </div>

                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="transition-opacity duration-300 ease-in-out opacity-100">
                            <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
                                {t('aiError', { error })}
                            </div>
                        </div>
                    )}

                    {/* Main dashboard content with fade in transition */}
                    {!error && (
                        <div className={`transition-all duration-500 ease-in-out ${
                            isLoading
                                ? 'opacity-0 transform translate-y-4 pointer-events-none'
                                : 'opacity-100 transform translate-y-0'
                        }`}>
                            <DashboardSections
                                processedData={processedData}
                                data={data}
                                isAiLoading={isAiLoading}
                                isAiAvailable={isAiAvailable}
                                consumptionTimeRange={consumptionTimeRange}
                                setConsumptionTimeRange={setConsumptionTimeRange}
                                comparisonMetric={comparisonMetric}
                                setComparisonMetric={setComparisonMetric}
                                rechargeYear={rechargeYear}
                                isHistoryLoading={isHistoryLoading}
                                handleYearChange={handleYearChange}
                                banglaEnabled={account.banglaEnabled}
                                balanceUnavailable={!!(data?.balance && (data.balance.balance === null || data.balance.balance === undefined))}
                                account={account}
                                showNotification={handleShowNotification}
                                retryAiSummary={retryAiSummary}
                                // New distributed AI insights
                                distributedAiInsights={distributedAiInsights}
                                aiLoadingStates={aiLoadingStates}
                                onSetupApiKey={() => setIsApiKeyModalOpen(true)}
                            />
                        </div>
                    )}
                </div>
            </main>
            <ConfirmationDialog
                isOpen={portalConfirmation.isOpen}
                onClose={() => setPortalConfirmation({ isOpen: false })}
                onConfirm={handleOpenPortal}
                title={t('openDescoPortal')}
                message={t('openDescoPortalMsg', { accountNo: account.accountNo })}
                confirmText={t('copyOpenPortal')}
                cancelText={t('cancel')}
                confirmButtonClass="bg-cyan-600 hover:bg-cyan-700"
                icon={<BuildingOfficeIcon className="w-6 h-6" />}
            />
            
            {deleteConfirmation.isOpen && (
                <ConfirmationDialog
                    isOpen={true}
                    onClose={() => setDeleteConfirmation({ isOpen: false })}
                    onConfirm={() => {
                        if (deleteConfirmation.accountNo) {
                            onDelete(deleteConfirmation.accountNo);
                        }
                        setDeleteConfirmation({ isOpen: false });
                    }}
                    title={t('deleteAccount')}
                    message={deleteConfirmation.accountNo
                        ? t('deleteAccountMsg', { accountNo: deleteConfirmation.accountNo })
                        : t('noAccountToDelete')
                    }
                    confirmText={t('deleteAccount')}
                    cancelText={t('cancel')}
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                    icon={<TrashIcon className="w-6 h-6" />}
                />
            )}

            {/* API Key Management Modal */}
            <ApiKeyManagementModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                onApiKeyUpdated={() => {
                    showNotification('API key updated successfully', 'info');
                    // Close the modal and refresh AI data without full page reload
                    setIsApiKeyModalOpen(false);
                    // Trigger a refresh of AI insights if available
                    if (forceRefreshAiSummary) {
                        forceRefreshAiSummary();
                    }
                }}
            />

            <Footer />
        </div>
    );
};

export default AccountDashboardView;