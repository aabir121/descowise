import React from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import ConfirmationDialog from './common/ConfirmationDialog';
import { BuildingOfficeIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/Icons';
import useDashboardData from './dashboard/useDashboardData';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardSections from './dashboard/DashboardSections';
import Footer from './common/Footer';
import { useState } from 'react';
import { askGeminiAboutAccount } from '../services/descoService';
import FloatingCoffeeButton from './FloatingCoffeeButton';
import { formatHumanDate } from '../utils/dataSanitization';
import Modal from './common/Modal';

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

    // Chatbot state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'bot', content: string}>>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

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
                onDelete={onDelete}
                setPortalConfirmation={setPortalConfirmation}
            />
            {/* As of date display */}
            {data?.balance?.readingTime && (
                <div className="text-xs text-slate-400 text-right px-4 sm:px-6 lg:px-8 mt-1 mb-2">
                    Data as of {formatHumanDate(new Date(data.balance.readingTime))}
                </div>
            )}
            {/* Show notification if balance data is null */}
            {data?.balance && (data.balance.balance === null || data.balance.currentMonthConsumption === null) && (
                <div className="flex items-center justify-center bg-yellow-100 text-yellow-900 border border-yellow-400 px-6 py-4 rounded-lg shadow-md w-full text-base font-semibold mb-4 gap-3" style={{ minHeight: '64px' }}>
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <span>Balance information temporarily unavailable</span>
                    <button
                        onClick={() => setIsBalanceModalOpen(true)}
                        className="p-1 rounded hover:bg-yellow-200 focus:outline-none ml-2"
                        aria-label="More information about unavailable balance"
                    >
                        <InformationCircleIcon className="w-5 h-5 text-yellow-500 hover:text-yellow-600" />
                    </button>
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
                        banglaEnabled={account.banglaEnabled}
                        balanceUnavailable={!!(data?.balance && (data.balance.balance === null || data.balance.currentMonthConsumption === null))}
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
            
            {/* Balance Information Modal */}
            <Modal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <InformationCircleIcon className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-slate-100">Balance Information Unavailable</h3>
                    </div>
                    <div className="text-slate-300 text-sm space-y-3">
                        <p>
                            We're unable to display your current balance at this time. This could be due to:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Temporary service maintenance</li>
                            <li>Account status changes</li>
                            <li>Network connectivity issues</li>
                            <li>Recent meter reading updates</li>
                        </ul>
                        <p className="text-slate-400 text-xs mt-4">
                            Your balance information will be updated automatically once available. You can also check your balance directly through the official DESCO portal.
                        </p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setIsBalanceModalOpen(false)}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </Modal>
            
            <Footer />
        </div>
    );
};

export default AccountDashboardView;