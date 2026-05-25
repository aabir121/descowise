import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '../types';
import { TrashIcon, PencilIcon, ExclamationTriangleIcon, ShareIcon } from './common/Icons';
import { DeleteButton } from './common/Section';
import ShareModal from './common/ShareModal';
import AccountInfoRow from './account/AccountInfoRow';
import BalanceDisplay from './account/BalanceDisplay';
import { hasStoredApiKey } from '../utils/apiKeyStorage';

interface AccountCardProps {
    account: Account;
    onSelect: (accountNo: string) => void;
    onDelete: (accountNo: string) => void;
    isBalanceLoading: boolean;
    onUpdateDisplayName?: (accountNo: string, newDisplayName: string) => void;
    onUpdateAiInsightsEnabled?: (accountNo: string, enabled: boolean) => void;
    onUpdateBanglaEnabled?: (accountNo: string, enabled: boolean) => void;
    onOpenApiKeyModal?: () => void;
    isArrangeMode?: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

const AccountCard: React.FC<AccountCardProps> = memo(({
    account,
    onSelect,
    onDelete,
    isBalanceLoading,
    onUpdateDisplayName,
    onUpdateAiInsightsEnabled,
    onUpdateBanglaEnabled,
    onOpenApiKeyModal,
    isArrangeMode = false,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false
}) => {
    const { t } = useTranslation();

    const displayName = useMemo(
        () => account.displayName || `${t('account')} ${account.accountNo}`,
        [account.displayName, account.accountNo, t]
    );

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState(displayName);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        setHasApiKey(hasStoredApiKey());
    }, []);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(account.accountNo);
    }, [onDelete, account.accountNo]);

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setEditModalOpen(true);
    }, []);

    const handleEditSave = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (onUpdateDisplayName) {
            onUpdateDisplayName(account.accountNo, editDisplayName);
        }
        setEditModalOpen(false);
    }, [onUpdateDisplayName, account.accountNo, editDisplayName]);

    const handleEditCancel = useCallback(() => {
        setEditDisplayName(displayName);
        setEditModalOpen(false);
    }, [displayName]);

    const handleCardClick = useCallback(() => {
        if (isArrangeMode) {
            return;
        }
        onSelect(account.accountNo);
    }, [isArrangeMode, onSelect, account.accountNo]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (isArrangeMode) {
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(account.accountNo);
        }
    }, [isArrangeMode, onSelect, account.accountNo]);

    const handleCopyAccountNo = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(account.accountNo);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy account number: ', err);
        }
    }, [account.accountNo]);

    const handleShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsShareModalOpen(true);
    }, []);

    return (
        <>
            <div
                role={isArrangeMode ? 'group' : 'button'}
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={handleKeyDown}
                className={`relative rounded-2xl border bg-slate-800 p-6 shadow-lg transition-all duration-300 ease-in-out transform ${
                    isArrangeMode
                        ? 'cursor-grab border-cyan-500/60 ring-1 ring-cyan-400/30'
                        : 'cursor-pointer border-slate-700 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/10'
                }`}
                aria-label={isArrangeMode ? `${displayName} arrangement card` : `${t('selectAccount')} ${displayName}`}
                aria-disabled={isArrangeMode}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="max-w-[70%] truncate pr-4 text-xl font-bold text-slate-100">{displayName}</h3>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="rounded p-1 hover:bg-slate-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                            title={t('shareAccount')}
                            onClick={handleShare}
                            tabIndex={isArrangeMode ? -1 : 0}
                            aria-label={t('shareAccount')}
                            disabled={isArrangeMode}
                        >
                            <ShareIcon className="h-5 w-5 text-cyan-400" />
                        </button>
                        <button
                            type="button"
                            className="rounded p-1 hover:bg-slate-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                            title={t('editDisplayName')}
                            onClick={handleEditClick}
                            tabIndex={isArrangeMode ? -1 : 0}
                            aria-label={t('editDisplayName')}
                            disabled={isArrangeMode}
                        >
                            <PencilIcon className="h-5 w-5 text-cyan-400" />
                        </button>
                        <DeleteButton
                            onClick={handleDeleteClick}
                            title={t('deleteAccount')}
                            className="ml-2"
                            noPadding={true}
                            disabled={isArrangeMode}
                        >
                            <TrashIcon className="h-5 w-5 text-red-500" />
                        </DeleteButton>
                    </div>
                </div>

                {isArrangeMode && (
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                        <span>{t('arrangeModeHint', 'Drag cards or use the move buttons to reorder')}</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveUp?.();
                                }}
                                disabled={!canMoveUp}
                                className="rounded-md border border-cyan-400/40 px-2 py-1 text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={t('moveCardUp', 'Move card up')}
                            >
                                Up
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveDown?.();
                                }}
                                disabled={!canMoveDown}
                                className="rounded-md border border-cyan-400/40 px-2 py-1 text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={t('moveCardDown', 'Move card down')}
                            >
                                Down
                            </button>
                        </div>
                    </div>
                )}

                <div className="mb-4 flex w-full flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{t('aiInsights')}</span>
                        <div className="relative">
                            <button
                                type="button"
                                className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                                    account.aiInsightsEnabled ? 'bg-cyan-500' :
                                    !hasApiKey ? 'bg-yellow-600/50' : 'bg-slate-600'
                                }`}
                                aria-pressed={account.aiInsightsEnabled}
                                aria-label={account.aiInsightsEnabled ? t('disableAiInsights') : t('enableAiInsights')}
                                title={!hasApiKey ? t('apiKeyRequiredForAi', 'API key required for AI features') : undefined}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (isArrangeMode) {
                                        return;
                                    }
                                    if (!hasApiKey && onOpenApiKeyModal) {
                                        onOpenApiKeyModal();
                                    } else {
                                        onUpdateAiInsightsEnabled?.(account.accountNo, !account.aiInsightsEnabled);
                                    }
                                }}
                                disabled={isArrangeMode}
                            >
                                <span
                                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                                        account.aiInsightsEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                                <span className="sr-only">{t('toggleAiInsights')}</span>
                            </button>
                            {!hasApiKey && (
                                <ExclamationTriangleIcon className="absolute -right-1 -top-1 h-3 w-3 text-yellow-400" />
                            )}
                        </div>
                        <span className={`text-xs font-semibold ${
                            account.aiInsightsEnabled ? 'text-cyan-400' :
                            !hasApiKey ? 'text-yellow-400' : 'text-slate-500'
                        }`}>
                            {account.aiInsightsEnabled ? t('on') : (!hasApiKey ? t('setupRequired', 'Setup Required') : t('off'))}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{t('bangla')}</span>
                        <button
                            type="button"
                            className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                                account.banglaEnabled ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                            aria-pressed={account.banglaEnabled}
                            aria-label={account.banglaEnabled ? t('disableBanglaLanguage') : t('enableBanglaLanguage')}
                            onClick={e => {
                                e.stopPropagation();
                                if (isArrangeMode) {
                                    return;
                                }
                                onUpdateBanglaEnabled?.(account.accountNo, !account.banglaEnabled);
                            }}
                            disabled={isArrangeMode}
                        >
                            <span
                                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                                    account.banglaEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                            <span className="sr-only">{t('toggleBanglaLanguage')}</span>
                        </button>
                        <span className={`text-xs font-semibold ${account.banglaEnabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {account.banglaEnabled ? t('on') : t('off')}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 text-sm">
                    <AccountInfoRow
                        label={`${t('accountNo')}:`}
                        value={account.accountNo}
                        onCopy={handleCopyAccountNo}
                        copyStatus={copyStatus}
                        t={t}
                    />
                    <AccountInfoRow label={`${t('customerName')}:`} value={account.customerName} valueClassName="truncate max-w-[150px]" t={t} />
                    <AccountInfoRow label={`${t('meterNo')}:`} value={account.meterNo} t={t} />
                    <div className="flex min-h-[50px] items-start justify-between pt-2">
                        <span className="text-base font-medium text-slate-400">{t('balance')}:</span>
                        <BalanceDisplay
                            isLoading={isBalanceLoading}
                            balance={account.balance}
                            readingTime={account.readingTime}
                            naClassName="break-words text-2xl font-extrabold text-yellow-400 sm:text-3xl md:text-4xl"
                        />
                    </div>
                </div>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={handleEditCancel}>
                    <div className="relative m-auto w-full max-w-md rounded-2xl bg-slate-800 p-6 text-slate-100 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="mb-4 text-xl font-bold">{t('editDisplayName')}</h2>
                        <div className="mb-4 rounded bg-slate-700/60 p-3 text-sm text-slate-300">
                            <div className="mb-1">{t('changingDisplayNameFor')} <span className="font-semibold">{account.displayName || `${t('account')} ${account.accountNo}`}</span></div>
                            <div className="flex flex-col gap-0.5 text-xs">
                                <span>{t('accountNo')}: <span className="font-mono">{account.accountNo}</span></span>
                                <span>{t('customerName')}: <span className="font-mono">{account.customerName}</span></span>
                                <span>{t('meterNo')}: <span className="font-mono">{account.meterNo}</span></span>
                            </div>
                        </div>
                        <form onSubmit={handleEditSave}>
                            <input
                                type="text"
                                className="mb-4 w-full rounded border border-slate-600 bg-slate-700 p-2 text-slate-100 outline-none focus:border-cyan-400"
                                value={editDisplayName}
                                onChange={e => setEditDisplayName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" className="rounded bg-slate-600 px-4 py-2 hover:bg-slate-700" onClick={handleEditCancel}>{t('cancel')}</button>
                                <button type="submit" className="rounded bg-cyan-500 px-4 py-2 font-semibold text-white hover:bg-cyan-600">{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                account={account}
            />
        </>
    );
});

export default AccountCard;
