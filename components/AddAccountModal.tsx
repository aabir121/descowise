import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Account, AccountInfo } from '../types';
import { verifyAccount } from '../services/descoService';
import { CloseIcon } from './common/Icons';
import Spinner from './common/Spinner';
import { useModal } from '../App';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded: (account: Account) => void;
    existingAccounts: Account[];
    preVerifiedAccount?: { accountNo: string; data: AccountInfo } | null;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded, existingAccounts, preVerifiedAccount }) => {
    const { t, i18n } = useTranslation();
    const Modal = useModal();
    const [step, setStep] = useState<'form' | 'details'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [verifiedData, setVerifiedData] = useState<AccountInfo | null>(null);
    const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
    const [banglaEnabled, setBanglaEnabled] = useState(false);

    const resetState = useCallback(() => {
        if (preVerifiedAccount) {
            // If we have a pre-verified account, go directly to details step
            setStep('details');
            setAccountNumber(preVerifiedAccount.accountNo);
            setVerifiedData(preVerifiedAccount.data);
            setDisplayName(preVerifiedAccount.data.customerName || '');
            setMessage({ text: t('accountVerifiedSuccessfully'), type: 'success' });
        } else {
            // Normal reset for manual entry
            setStep('form');
            setAccountNumber('');
            setDisplayName('');
            setVerifiedData(null);
            setMessage(null);
        }
        setIsLoading(false);
        setAiInsightsEnabled(true);
        setBanglaEnabled(i18n.language === 'bn');
    }, [i18n.language, preVerifiedAccount, t]);

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
        onClose(); // Close the modal after adding the account
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} mobileFullscreen>
            <div className="flex min-h-full flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-slate-700 px-5 py-[max(1rem,env(safe-area-inset-top))] sm:p-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                            {step === 'form' ? t('addAccountStepOne', 'Step 1 of 2') : t('addAccountStepTwo', 'Step 2 of 2')}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-white">{step === 'form' ? t('addNewAccount') : t('confirmAccount')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        aria-label={t('closeModal')}
                        type="button"
                    >
                        <span className="w-6 h-6 block">
                            <CloseIcon />
                        </span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto px-5 py-8 sm:p-6">
                    <div className="mx-auto w-full max-w-md">
                    {message && (message.type === 'error' || step === 'form') && (
                        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-green-500/20 bg-green-500/10 text-green-200' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    {step === 'form' && (
                    <>
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold tracking-tight text-slate-50">{t('addAccountHeading', 'Add your DESCO account')}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-400">{t('addAccountIntro', 'Enter the account number shown on your DESCO bill. We will verify it before adding anything.')}</p>
                        </div>
                        <form onSubmit={handleVerify} className="space-y-5">
                            <div>
                                <label htmlFor="accountNo" className="mb-2 block text-sm font-semibold text-slate-200">{t('accountNumber')}</label>
                            <input
                                type="text"
                                id="accountNo"
                                inputMode="numeric"
                                autoFocus
                                value={accountNumber}
                                onChange={(e) => {
                                    setAccountNumber(e.target.value);
                                    if (message?.type === 'error') {
                                        setMessage(null);
                                    }
                                }}
                                placeholder={t('enterAccountNumberPlaceholder')}
                                className="w-full rounded-2xl border border-slate-600 bg-slate-900 px-4 py-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                                aria-required="true"
                                aria-invalid={message?.type === 'error'}
                                aria-describedby={message ? "form-message" : undefined}
                            />
                            <p className="mt-2 text-xs leading-5 text-slate-500">{t('addAccountHelp', 'You can find this number on your bill or DESCO account statement.')}</p>
                        </div>
                        {message && <p id="form-message" role="alert" className="sr-only">{message.text}</p>}
                        <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-4 text-base font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
                            {isLoading ? <><Spinner /> {t('verifying')}...</> : t('verifyAccount')}
                        </button>
                    </form>
                    </>
                )}

                {step === 'details' && verifiedData && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-50">{t('accountFound', 'Account found')}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{t('accountFoundIntro', 'Check the account below, then save it to your dashboard.')}</p>
                        </div>
                        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                            <p className="text-sm font-semibold text-slate-100">{verifiedData.customerName || t('na')}</p>
                            <p className="mt-1 text-sm text-slate-400">{t('accountNumber')}: {verifiedData.accountNo}</p>
                            {verifiedData.meterNo && <p className="mt-1 text-sm text-slate-400">{t('meterNumber')}: {verifiedData.meterNo}</p>}
                        </section>
                        <div>
                            <label htmlFor="displayName" className="mb-2 block text-sm font-semibold text-slate-200">{t('displayNameOptional')}</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={t('displayNamePlaceholder')}
                                className="w-full rounded-2xl border border-slate-600 bg-slate-900 px-4 py-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                            />
                            <p className="mt-2 text-xs text-slate-500">{t('displayNameHint', 'For example: Home, Office, or Parents') }</p>
                        </div>
                        <details className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
                            <summary className="cursor-pointer font-semibold text-slate-200">{t('accountDetails', 'Account details')}</summary>
                            <dl className="mt-4 space-y-3 text-sm">
                                {[
                                    [t('contactNumber'), verifiedData.contactNo],
                                    [t('feederName'), verifiedData.feederName],
                                    [t('tariffSolution'), verifiedData.tariffSolution],
                                    [t('sanctionLoad'), verifiedData.sanctionLoad],
                                    [t('installationAddress'), verifiedData.installationAddress]
                                ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
                                    <div key={String(label)}>
                                        <dt className="text-xs font-medium text-slate-500">{label}</dt>
                                        <dd className="mt-0.5 text-slate-200">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </details>
                        <p className="text-xs leading-5 text-slate-500">{t('accountPreferencesLater', 'AI and language preferences can be changed later from the account settings.')}</p>
                        <div className="grid grid-cols-2 gap-3 pb-4">
                            <button onClick={() => { setStep('form'); setMessage(null); }} className="rounded-2xl border border-slate-600 px-4 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700">{t('back', 'Back')}</button>
                            <button onClick={handleConfirmAdd} className="rounded-2xl bg-cyan-400 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">{t('addAccount')}</button>
                        </div>
                    </div>
                )}
                </div>
                </main>
            </div>
        </Modal>
    );
};

export default AddAccountModal;
