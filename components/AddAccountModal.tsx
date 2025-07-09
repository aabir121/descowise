import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Account, AccountInfo } from '../types';
import { verifyAccount } from '../services/descoService';
import { CloseIcon } from './common/Icons';
import Modal from './common/Modal';
import Spinner from './common/Spinner';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded: (account: Account) => void;
    existingAccounts: Account[];
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded, existingAccounts }) => {
    const [step, setStep] = useState<'form' | 'details'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [verifiedData, setVerifiedData] = useState<AccountInfo | null>(null);
    const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);

    const resetState = useCallback(() => {
        setStep('form');
        setIsLoading(false);
        setMessage(null);
        setAccountNumber('');
        setDisplayName('');
        setVerifiedData(null);
        setAiInsightsEnabled(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen, resetState]);

    if (!isOpen) return null;

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountNumber.trim()) {
            setMessage({ text: 'Please enter an account number.', type: 'error' });
            return;
        }
        const trimmedAccountNumber = accountNumber.trim();
        const existingAccount = existingAccounts.find(acc => acc.accountNo === trimmedAccountNumber);
        if (existingAccount) {
            setMessage({ 
                text: `Account ${trimmedAccountNumber} is already added. Please use a different account number.`, 
                type: 'error' 
            });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        const result = await verifyAccount(trimmedAccountNumber);
        setIsLoading(false);
        if (!result.success) {
            setMessage({ text: result.message, type: 'error' });
            return;
        }
        setVerifiedData(result.data);
        setMessage({ text: 'Account verified successfully! Review the details below.', type: 'success' });
        setStep('details');
    };

    const handleConfirmAdd = () => {
        if (!verifiedData) return;
        const newAccount: Account = {
            ...verifiedData,
            displayName: displayName.trim() || null,
            dateAdded: new Date().toISOString(),
            aiInsightsEnabled, // Add this property to the account object
        } as Account & { aiInsightsEnabled: boolean };
        onAccountAdded(newAccount);
    };

    const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
        <div className="py-2">
            <span className="text-sm font-medium text-slate-400">{label}</span>
            <p className="text-base font-semibold text-slate-100">{value || 'N/A'}</p>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-white">{step === 'form' ? 'Add New Account' : 'Confirm Account'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
                        <CloseIcon />
                    </button>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}

                {step === 'form' && (
                    <form onSubmit={handleVerify}>
                        <div className="mb-4">
                            <label htmlFor="accountNo" className="block text-sm font-medium text-slate-300 mb-1">Account Number</label>
                            <input
                                type="text"
                                id="accountNo"
                                value={accountNumber}
                                onChange={(e) => {
                                    setAccountNumber(e.target.value);
                                    if (message?.type === 'error') {
                                        setMessage(null);
                                    }
                                }}
                                placeholder="Enter your DESCO account number"
                                className="w-full px-4 py-3 bg-slate-700 text-slate-100 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder-slate-400"
                                aria-required="true"
                                aria-invalid={message?.type === 'error'}
                                aria-describedby={message ? "form-message" : undefined}
                            />
                        </div>
                        {message && <p id="form-message" role="alert" className="sr-only">{message.text}</p>}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none">
                            {isLoading ? <><Spinner /> Verifying...</> : 'Verify Account'}
                        </button>
                    </form>
                )}

                {step === 'details' && verifiedData && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-h-60 overflow-y-auto pr-2">
                            <DetailItem label="Account Number" value={verifiedData.accountNo} />
                            <DetailItem label="Customer Name" value={verifiedData.customerName} />
                            <DetailItem label="Contact Number" value={verifiedData.contactNo} />
                            <DetailItem label="Feeder Name" value={verifiedData.feederName} />
                            <DetailItem label="Meter Number" value={verifiedData.meterNo} />
                            <DetailItem label="Tariff Solution" value={verifiedData.tariffSolution} />
                            <DetailItem label="Sanction Load" value={verifiedData.sanctionLoad} />
                            <div className="sm:col-span-2">
                                <DetailItem label="Installation Address" value={verifiedData.installationAddress} />
                            </div>
                        </div>
                        <div className="mt-6">
                            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-1">Display Name (Optional)</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g., My Home Account"
                                className="w-full px-4 py-3 bg-slate-700 text-slate-100 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder-slate-400"
                            />
                        </div>
                        {/* AI Insights Toggle */}
                        <div className="flex flex-col items-center gap-3 my-4">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-200 font-medium text-base">Enable AI Insights</span>
                                <button
                                    type="button"
                                    className={`relative inline-flex h-6 w-10 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${aiInsightsEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                                    aria-pressed={aiInsightsEnabled}
                                    onClick={() => setAiInsightsEnabled(v => !v)}
                                    style={{ minWidth: '40px' }}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${aiInsightsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                                    />
                                    <span className="sr-only">Toggle AI Insights</span>
                                </button>
                            </div>
                            <span className="text-xs text-slate-400 max-w-xs text-center leading-tight">AI Insights provide personalized energy and recharge analysis for your account. You can change this setting later.</span>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button onClick={resetState} className="w-full bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-500 transition">Cancel</button>
                            <button onClick={handleConfirmAdd} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 hover:shadow-lg transition-transform transform hover:-translate-y-0.5">Add Account</button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddAccountModal;