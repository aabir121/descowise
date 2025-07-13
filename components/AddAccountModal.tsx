import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [step, setStep] = useState<'form' | 'details'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [verifiedData, setVerifiedData] = useState<AccountInfo | null>(null);
    const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
    const [banglaEnabled, setBanglaEnabled] = useState(false);

    const resetState = useCallback(() => {
        setStep('form');
        setIsLoading(false);
        setMessage(null);
        setAccountNumber('');
        setDisplayName('');
        setVerifiedData(null);
        setAiInsightsEnabled(true);
        setBanglaEnabled(false);
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
            setMessage({ text: t('pleaseEnterAccountNumber'), type: 'error' });
            return;
        }
        const trimmedAccountNumber = accountNumber.trim();
        const existingAccount = existingAccounts.find(acc => acc.accountNo === trimmedAccountNumber);
        if (existingAccount) {
            setMessage({ 
                text: t('accountAlreadyAdded', { accountNo: trimmedAccountNumber }), 
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
        setMessage({ text: t('accountVerifiedSuccessfully'), type: 'success' });
        setStep('details');
    };

    const handleConfirmAdd = () => {
        if (!verifiedData) return;
        const newAccount: Account = {
            ...verifiedData,
            displayName: displayName.trim() || null,
            dateAdded: new Date().toISOString(),
            aiInsightsEnabled, // Add this property to the account object
            banglaEnabled, // Persist Bangla language preference
        } as Account & { aiInsightsEnabled: boolean; banglaEnabled: boolean };
        onAccountAdded(newAccount);
    };

    const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
        <div className="py-2">
            <span className="text-sm font-medium text-slate-400">{label}</span>
            <p className="text-base font-semibold text-slate-100">{value || t('na')}</p>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-white">{step === 'form' ? t('addNewAccount') : t('confirmAccount')}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-300 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        aria-label={t('closeModal')}
                        type="button"
                    >
                        <span className="w-6 h-6 block">
                            <CloseIcon />
                        </span>
                    </button>
                </div>

                {message && (
                    <div className={`p-2 rounded-lg mb-3 text-xs ${message.type === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}

                {step === 'form' && (
                    <form onSubmit={handleVerify}>
                        <div className="mb-2">
                            <label htmlFor="accountNo" className="block text-xs font-medium text-slate-300 mb-1">{t('accountNumber')}</label>
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
                                placeholder={t('enterAccountNumberPlaceholder')}
                                className="w-full px-3 py-2 bg-slate-700 text-slate-100 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder-slate-400 text-sm"
                                aria-required="true"
                                aria-invalid={message?.type === 'error'}
                                aria-describedby={message ? "form-message" : undefined}
                            />
                        </div>
                        {message && <p id="form-message" role="alert" className="sr-only">{message.text}</p>}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-cyan-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none text-sm">
                            {isLoading ? <><Spinner /> {t('verifying')}...</> : t('verifyAccount')}
                        </button>
                    </form>
                )}

                {step === 'details' && verifiedData && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-48 overflow-y-auto pr-1">
                            <DetailItem label={t('accountNumber')} value={verifiedData.accountNo} />
                            <DetailItem label={t('customerName')} value={verifiedData.customerName} />
                            <DetailItem label={t('contactNumber')} value={verifiedData.contactNo} />
                            <DetailItem label={t('feederName')} value={verifiedData.feederName} />
                            <DetailItem label={t('meterNumber')} value={verifiedData.meterNo} />
                            <DetailItem label={t('tariffSolution')} value={verifiedData.tariffSolution} />
                            <DetailItem label={t('sanctionLoad')} value={verifiedData.sanctionLoad} />
                            <div className="sm:col-span-2">
                                <DetailItem label={t('installationAddress')} value={verifiedData.installationAddress} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label htmlFor="displayName" className="block text-xs font-medium text-slate-300 mb-1">{t('displayNameOptional')}</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={t('displayNamePlaceholder')}
                                className="w-full px-3 py-2 bg-slate-700 text-slate-100 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder-slate-400 text-sm"
                            />
                        </div>
                        {/* AI Insights and Bangla Language Toggles Side by Side */}
                        <div className="flex flex-col items-center gap-2 my-2">
                            <div className="flex flex-row items-center gap-4">
                                {/* AI Insights Toggle */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-200 font-medium text-xs">{t('enableAiInsights')}</span>
                                        <button
                                            type="button"
                                            className={`relative inline-flex h-5 w-8 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${aiInsightsEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                                            aria-pressed={aiInsightsEnabled}
                                            onClick={() => setAiInsightsEnabled(v => !v)}
                                            style={{ minWidth: '32px' }}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${aiInsightsEnabled ? 'translate-x-3' : 'translate-x-0.5'}`}
                                            />
                                            <span className="sr-only">{t('toggleAiInsights')}</span>
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400 max-w-xs text-center leading-tight">{t('aiInsightsDescription')}</span>
                                </div>
                                {/* Bangla Language Toggle */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-200 font-medium text-xs">{t('enableBanglaLanguage')}</span>
                                        <button
                                            type="button"
                                            className={`relative inline-flex h-5 w-8 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${banglaEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                                            aria-pressed={banglaEnabled}
                                            onClick={() => setBanglaEnabled(v => !v)}
                                            style={{ minWidth: '32px' }}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${banglaEnabled ? 'translate-x-3' : 'translate-x-0.5'}`}
                                            />
                                            <span className="sr-only">{t('toggleBanglaLanguage')}</span>
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400 max-w-xs text-center leading-tight">{t('banglaLanguageDescription')}</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 max-w-xs text-center leading-tight">{t('settingsCanBeChangedLater')}</span>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button onClick={resetState} className="w-full bg-slate-600 text-slate-200 font-bold py-2 px-3 rounded-lg hover:bg-slate-500 transition text-sm">{t('cancel')}</button>
                            <button onClick={handleConfirmAdd} className="w-full bg-cyan-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-cyan-700 hover:shadow-lg transition-transform transform hover:-translate-y-0.5 text-sm">{t('addAccount')}</button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddAccountModal;