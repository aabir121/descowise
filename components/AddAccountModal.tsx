import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Account, AccountInfo } from '../types';
import { verifyAccount } from '../services/descoService';
import { createAccountToSave } from '../utils/addAccountFlow';
import { CloseIcon } from './common/Icons';
import Spinner from './common/Spinner';
import { useModal } from '../App';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded: (account: Account) => void | Promise<void>;
    existingAccounts: Account[];
    preVerifiedAccount?: { accountNo: string; data: AccountInfo } | null;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded, existingAccounts, preVerifiedAccount }) => {
    const { t, i18n } = useTranslation();
    const Modal = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [addAnother, setAddAnother] = useState(false);
    const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
    const [banglaEnabled, setBanglaEnabled] = useState(false);

    const resetState = useCallback(() => {
        setAccountNumber(preVerifiedAccount?.accountNo || '');
        setDisplayName('');
        setAddAnother(false);
        setMessage(null);
        setIsLoading(false);
        setAiInsightsEnabled(true);
        setBanglaEnabled(i18n.language === 'bn');
    }, [i18n.language, preVerifiedAccount]);

    useEffect(() => {
        if (isOpen) resetState();
    }, [isOpen, resetState]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedAccountNumber = accountNumber.trim();
        if (!trimmedAccountNumber) {
            setMessage({ text: t('pleaseEnterAccountNumber'), type: 'error' });
            return;
        }
        if (existingAccounts.some(account => account.accountNo === trimmedAccountNumber)) {
            setMessage({ text: t('accountAlreadyAdded', { accountNo: trimmedAccountNumber }), type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            const result = await verifyAccount(trimmedAccountNumber);
            if (!result.success || !result.data) {
                setMessage({ text: result.message || 'Unable to verify account.', type: 'error' });
                return;
            }

            await onAccountAdded(createAccountToSave(result.data, displayName, aiInsightsEnabled, banglaEnabled));
            if (addAnother) {
                setAccountNumber('');
                setDisplayName('');
                setMessage(null);
            } else {
                onClose();
            }
        } catch (error) {
            setMessage({ text: (error as Error).message || 'Unable to add account.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} mobileFullscreen>
            <div className="flex min-h-full flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-slate-700 px-5 py-[max(1rem,env(safe-area-inset-top))] sm:p-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{t('addAccountStepOne', 'Add account')}</p>
                        <h2 className="mt-1 text-xl font-bold text-white">{t('addNewAccount')}</h2>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800" aria-label={t('closeModal')} type="button">
                        <span className="block h-6 w-6"><CloseIcon /></span>
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto px-5 py-8 sm:p-6">
                    <div className="mx-auto w-full max-w-md">
                        {message && <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{message.text}</div>}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold tracking-tight text-slate-50">{t('addAccountHeading', 'Add your DESCO account')}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-400">{t('descoLinkIntro', 'Enter your account number and an optional name. We will verify and save it together.')}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="accountNo" className="mb-2 block text-sm font-semibold text-slate-200">{t('accountNumber')}</label>
                                <input type="text" id="accountNo" inputMode="numeric" autoFocus value={accountNumber} onChange={e => { setAccountNumber(e.target.value); if (message) setMessage(null); }} placeholder={t('enterAccountNumberPlaceholder')} className="w-full rounded-2xl border border-slate-600 bg-slate-900 px-4 py-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" aria-required="true" aria-invalid={message?.type === 'error'} />
                                <p className="mt-2 text-xs leading-5 text-slate-500">{t('addAccountHelp', 'You can find this number on your bill or DESCO account statement.')}</p>
                            </div>
                            <div>
                                <label htmlFor="displayName" className="mb-2 block text-sm font-semibold text-slate-200">{t('displayNameOptional')}</label>
                                <input type="text" id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('displayNamePlaceholder')} className="w-full rounded-2xl border border-slate-600 bg-slate-900 px-4 py-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
                            </div>
                            <label className="flex items-center gap-3 text-sm text-slate-300">
                                <input type="checkbox" checked={addAnother} onChange={e => setAddAnother(e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-cyan-400" />
                                {t('addAnotherAccount', 'Add another account after saving')}
                            </label>
                            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-4 text-base font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
                                {isLoading ? <><Spinner /> {t('verifying')}...</> : t('addAccount')}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </Modal>
    );
};

export default AddAccountModal;
