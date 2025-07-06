import React, { useState, useEffect, useCallback } from 'react';
import { Account, AccountInfo } from '../types';
import { verifyAccount } from '../services/descoService';
import { CloseIcon } from './Icons';
import Spinner from './Spinner';

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
    
    const resetState = useCallback(() => {
        setStep('form');
        setIsLoading(false);
        setMessage(null);
        setAccountNumber('');
        setDisplayName('');
        setVerifiedData(null);
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

        // Check if account already exists
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
            dateAdded: new Date().toISOString()
        };
        onAccountAdded(newAccount);
    };

    const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
        <div className="py-2">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <p className="text-base font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg text-gray-800 m-auto transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{step === 'form' ? 'Add New Account' : 'Confirm Account'}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                            <CloseIcon />
                        </button>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    {step === 'form' && (
                        <form onSubmit={handleVerify}>
                            <div className="mb-4">
                                <label htmlFor="accountNo" className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                <input
                                    type="text"
                                    id="accountNo"
                                    value={accountNumber}
                                    onChange={(e) => {
                                        setAccountNumber(e.target.value);
                                        // Clear error message when user starts typing
                                        if (message?.type === 'error') {
                                            setMessage(null);
                                        }
                                    }}
                                    placeholder="Enter your DESCO account number"
                                    className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder-gray-500"
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
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Display Name (Optional)</label>
                                <input
                                    type="text"
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="e.g., My Home Account"
                                    className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder-gray-500"
                                />
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button onClick={resetState} className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                                <button onClick={handleConfirmAdd} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 hover:shadow-lg transition-transform transform hover:-translate-y-0.5">Add Account</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddAccountModal;