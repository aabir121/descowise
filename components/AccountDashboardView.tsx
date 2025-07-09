import React from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import ConfirmationDialog from './common/ConfirmationDialog';
import { BuildingOfficeIcon, ExclamationTriangleIcon } from './common/Icons';
import useDashboardData from './dashboard/useDashboardData';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardSections from './dashboard/DashboardSections';
import Footer from './common/Footer';

const AccountDashboardView: React.FC<{ account: Account; onClose: () => void; onDelete: (accountNo: string) => void; showNotification: (message: string) => void; }> = ({ account, onClose, onDelete, showNotification }) => {
    const {
        processedData,
        isLoading,
        error,
        isAiLoading,
        isAiAvailable,
        rechargeYear,
        setRechargeYear,
        isHistoryLoading,
        consumptionTimeframe,
        setConsumptionTimeframe,
        comparisonMetric,
        setComparisonMetric,
        notification,
        setNotification,
        portalConfirmation,
        setPortalConfirmation,
        handleOpenPortal,
        handleYearChange,
        data,
    } = useDashboardData(account);

    return (
        <div className="fixed inset-0 z-40 bg-slate-900 text-slate-100 flex flex-col animate-fade-in">
            {/* {notification && <DashboardNotification message={notification} />} */}
            <DashboardHeader
                account={account}
                onClose={onClose}
                onDelete={onDelete}
                setPortalConfirmation={setPortalConfirmation}
            />
            {/* As of date display */}
            {data?.balance?.readingTime && (
                <div className="text-xs text-slate-400 text-right px-4 sm:px-6 lg:px-8 mt-1 mb-2">
                    Data as of {new Date(data.balance.readingTime).toLocaleString()}
                </div>
            )}
            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><Spinner size="w-12 h-12" /></div>
                ) : error ? (
                    <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>
                ) : (
                    <DashboardSections
                        processedData={processedData}
                        data={data}
                        isAiLoading={isAiLoading}
                        isAiAvailable={isAiAvailable}
                        consumptionTimeframe={consumptionTimeframe}
                        setConsumptionTimeframe={setConsumptionTimeframe}
                        comparisonMetric={comparisonMetric}
                        setComparisonMetric={setComparisonMetric}
                        rechargeYear={rechargeYear}
                        isHistoryLoading={isHistoryLoading}
                        handleYearChange={handleYearChange}
                    />
                )}
            </main>
            <ConfirmationDialog
                isOpen={portalConfirmation.isOpen}
                onClose={() => setPortalConfirmation({ isOpen: false })}
                onConfirm={handleOpenPortal}
                title="Open Official DESCO Portal"
                message={`This will copy your account ID "${account.accountNo}" to the clipboard and open the official DESCO customer portal in a new tab. You can then paste your account ID to log in.`}
                confirmText="Copy & Open Portal"
                cancelText="Cancel"
                confirmButtonClass="bg-cyan-600 hover:bg-cyan-700"
                icon={<BuildingOfficeIcon className="w-6 h-6" />}
            />
            <Footer />
        </div>
    );
};

export default AccountDashboardView;