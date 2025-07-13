import React from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import ConfirmationDialog from './common/ConfirmationDialog';
import { BuildingOfficeIcon, InformationCircleIcon, TrashIcon } from './common/Icons';
import useDashboardData from './dashboard/useDashboardData';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardSections from './dashboard/DashboardSections';
import Footer from './common/Footer';
import { useState } from 'react';
import { askGeminiAboutAccount } from '../services/descoService';
import FloatingCoffeeButton from './FloatingCoffeeButton';

import { useBalanceWarning } from '../hooks/useBalanceWarning';

// Helper function to calculate data staleness
function getDataStalenessInfo(readingTime?: string, language: 'bn' | 'en' = 'en'): { isStale: boolean; message: string } {
    if (!readingTime) return { isStale: false, message: '' };
    
    const latestDate = new Date(readingTime).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const daysBehind = Math.floor((new Date(today).getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysBehind > 0) {
        const message = language === 'bn' 
            ? `সর্বশেষ তথ্য ${latestDate} পর্যন্ত, ${daysBehind} দিন আগের`
            : `Last updated ${latestDate} (${daysBehind} day${daysBehind > 1 ? 's' : ''} ago)`;
        return { isStale: true, message };
    } else {
        const message = language === 'bn'
            ? `সর্বশেষ আপডেট: ${latestDate}`
            : `Last updated: ${latestDate}`;
        return { isStale: false, message };
    }
}

const AccountDashboardView: React.FC<{ account: Account; onClose: () => void; onDelete: (accountNo: string) => void; showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void; }> = ({ account, onClose, onDelete, showNotification }) => {
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
    } = useDashboardData(account);

    // Chatbot state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'bot', content: string}>>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const { open: openBalanceWarning } = useBalanceWarning();
    // Removed showBalanceWarning state

    // Calculate data staleness
    const stalenessInfo = getDataStalenessInfo(data?.balance?.readingTime, account.banglaEnabled ? 'bn' : 'en');

    // Placeholder for Gemini Q&A function
    async function handleSendMessage() {
        if (!chatInput.trim()) return;
        const userMessage = chatInput.trim();
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setChatLoading(true);
        try {
            const botReply = await askGeminiAboutAccount(
                userMessage,
                data,
                processedData,
                account.banglaEnabled || false
            );
            setChatHistory(prev => [...prev, { role: 'bot', content: botReply }]);
        } catch (e: any) {
            setChatHistory(prev => [...prev, { role: 'bot', content: 'Sorry, something went wrong: ' + (e?.message || 'Unknown error') }]);
        } finally {
            setChatLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-40 bg-slate-900 text-slate-100 flex flex-col animate-fade-in">
            {/* Top-of-dashboard Coffee Button, hidden when chat is open */}
            {!chatOpen && <div className="mb-4"><FloatingCoffeeButton /></div>}
            {/* {notification && <DashboardNotification message={notification} />} */}
            <DashboardHeader
                account={account}
                onClose={onClose}
                onDelete={handleDeleteAccount}
                setPortalConfirmation={setPortalConfirmation}
            />
            {/* As of date display */}
            {data?.balance?.readingTime && (
                <div className="text-xs text-slate-400 text-right px-4 sm:px-6 lg:px-8 mt-1 mb-2">
                    {stalenessInfo.message}
                </div>
            )}
            {/* Show notification if balance data is null */}
            {data?.balance && (data.balance.balance === null || data.balance.currentMonthConsumption === null) && (
                <div className="flex items-center justify-between max-w-md mx-auto bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-2 rounded-md text-sm mb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">DESCO balance data unavailable</span>
                        <button
                            onClick={() => openBalanceWarning()}
                            className="p-1 rounded hover:bg-yellow-100 focus:outline-none"
                            aria-label="More information about unavailable balance"
                        >
                            <InformationCircleIcon className="w-4 h-4 text-yellow-600 hover:text-yellow-700" />
                        </button>
                    </div>
                </div>
            )}
            <main className="flex-grow px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 lg:px-8 lg:pt-8 lg:pb-8 overflow-y-auto">
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
                        consumptionTimeRange={consumptionTimeRange}
                        setConsumptionTimeRange={setConsumptionTimeRange}
                        comparisonMetric={comparisonMetric}
                        setComparisonMetric={setComparisonMetric}
                        rechargeYear={rechargeYear}
                        isHistoryLoading={isHistoryLoading}
                        handleYearChange={handleYearChange}
                        banglaEnabled={account.banglaEnabled}
                        balanceUnavailable={!!(data?.balance && (data.balance.balance === null || data.balance.currentMonthConsumption === null))}
                        account={account}
                        showNotification={showNotification}
                    />
                )}
            </main>
            {/* Chatbot Floating Button and Panel (only if AI Insights enabled) */}
            {account.aiInsightsEnabled && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
                    {/*
                    <button
                        className="desco-chat-btn bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-lg p-4 focus:outline-none"
                        onClick={() => setChatOpen(true)}
                        aria-label="Open Chatbot"
                        style={{ display: chatOpen ? 'none' : 'block' }}
                    >
                        💬
                    </button>
                    */}
                    {chatOpen && (
                        <div className="w-80 max-w-full bg-slate-800 rounded-lg shadow-2xl flex flex-col h-96">
                            <div className="flex items-center justify-between p-3 border-b border-slate-700">
                                <span className="font-semibold">Ask DESCO AI</span>
                                <button className="text-slate-400 hover:text-slate-200" onClick={() => setChatOpen(false)} aria-label="Close Chatbot">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {chatHistory.length === 0 && <div className="text-slate-400 text-sm">Ask anything about your account, usage, or bills!</div>}
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                                        <div className={msg.role === 'user' ? 'inline-block bg-cyan-600 text-white rounded-lg px-3 py-1 mb-1' : 'inline-block bg-slate-700 text-slate-100 rounded-lg px-3 py-1 mb-1'}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && <div className="text-slate-400 text-xs">DESCO AI is typing...</div>}
                            </div>
                            <form className="p-3 border-t border-slate-700 flex gap-2" onSubmit={e => { e.preventDefault(); handleSendMessage(); }}>
                                <input
                                    className="flex-1 rounded bg-slate-700 text-slate-100 px-3 py-2 focus:outline-none"
                                    type="text"
                                    placeholder="Type your question..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    disabled={chatLoading}
                                />
                                <button
                                    type="submit"
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white rounded px-4 py-2 disabled:opacity-50"
                                    disabled={chatLoading || !chatInput.trim()}
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
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
                    title="Delete Account"
                    message={
                        deleteConfirmation.accountNo
                            ? `Are you sure you want to delete account "${deleteConfirmation.accountNo}"? This action cannot be undone and all account data will be permanently removed.`
                            : "No account selected for deletion."
                    }
                    confirmText="Delete Account"
                    cancelText="Cancel"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                    icon={<TrashIcon className="w-6 h-6" />}
                />
            )}

            <Footer />
        </div>
    );
};

export default AccountDashboardView;