import React, { useState } from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import { BoltIcon, TrashIcon, PencilIcon } from './common/Icons';
import { DeleteButton } from './common/Section';
import AccountInfoRow from './account/AccountInfoRow';
import BalanceDisplay from './account/BalanceDisplay';

interface AccountCardProps {
    account: Account;
    onSelect: (accountNo: string) => void;
    onDelete: (accountNo: string) => void;
    isBalanceLoading: boolean;
    onUpdateDisplayName?: (accountNo: string, newDisplayName: string) => void;
    onUpdateAiInsightsEnabled?: (accountNo: string, enabled: boolean) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect, onDelete, isBalanceLoading, onUpdateDisplayName, onUpdateAiInsightsEnabled }) => {
    const displayName = account.displayName || `Account ${account.accountNo}`;

    const hasBalance = account.balance !== null && account.balance !== undefined;

    const balanceValue = hasBalance ? parseFloat(String(account.balance).replace(/[^\d.-]/g, '')) : 0;
    const balanceDisplay = hasBalance ? `৳ ${balanceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A';

    const balanceColor = !isNaN(balanceValue) && balanceValue >= 0 ? 'text-cyan-400' : 'text-red-400';

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState(displayName);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(account.accountNo);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditModalOpen(true);
    };

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (onUpdateDisplayName) {
            onUpdateDisplayName(account.accountNo, editDisplayName);
        }
        setEditModalOpen(false);
    };

    const handleEditCancel = () => {
        setEditDisplayName(displayName);
        setEditModalOpen(false);
    };

    return (
        <>
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(account.accountNo)}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(account.accountNo);
                }
            }}
            className="relative bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer border border-slate-700 hover:border-cyan-500/50"
            aria-label={`Select account ${displayName}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-slate-100 truncate pr-4 max-w-[70%]">{displayName}</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="p-1 rounded hover:bg-slate-700 focus:outline-none"
                        title="Edit Display Name"
                        onClick={handleEditClick}
                        tabIndex={-1}
                        aria-label="Edit display name"
                    >
                        <PencilIcon className="w-5 h-5 text-cyan-400" />
                    </button>
                    <DeleteButton
                        onClick={handleDeleteClick}
                        title="Delete Account"
                        className="ml-2"
                        noPadding={true}
                    >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                    </DeleteButton>
                </div>
            </div>
            {/* AI Insights Toggle */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-slate-400 text-xs">AI Insights</span>
                <button
                    type="button"
                    className={`relative w-9 h-5 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${account.aiInsightsEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                    aria-pressed={account.aiInsightsEnabled}
                    aria-label={account.aiInsightsEnabled ? 'Disable AI Insights' : 'Enable AI Insights'}
                    onClick={e => {
                        e.stopPropagation();
                        onUpdateAiInsightsEnabled && onUpdateAiInsightsEnabled(account.accountNo, !account.aiInsightsEnabled);
                    }}
                >
                    <span
                        className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${account.aiInsightsEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                    <span className="sr-only">Toggle AI Insights</span>
                </button>
                <span className={`text-xs font-semibold ${account.aiInsightsEnabled ? 'text-cyan-400' : 'text-slate-500'}`}>{account.aiInsightsEnabled ? 'On' : 'Off'}</span>
            </div>
            <div className="space-y-2 text-sm">
                <AccountInfoRow label="Account No:" value={account.accountNo} />
                <AccountInfoRow label="Customer:" value={account.customerName} valueClassName="truncate max-w-[150px]" />
                <AccountInfoRow label="Meter No:" value={account.meterNo} />
                <div className="flex justify-between items-start pt-2 min-h-[50px]">
                    <span className="font-medium text-slate-400 text-base">Balance:</span>
                    <BalanceDisplay isLoading={isBalanceLoading} balance={account.balance !== null && account.balance !== undefined ? Number(account.balance) : null} readingTime={account.readingTime} />
                </div>
            </div>
        </div>
        {/* Edit Display Name Modal */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleEditCancel}>
                <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 relative m-auto p-6" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Edit Display Name</h2>
                    <div className="mb-4 text-slate-300 text-sm bg-slate-700/60 rounded p-3">
                        <div className="mb-1">Changing display name for <span className="font-semibold">{account.displayName || `Account ${account.accountNo}`}</span></div>
                        <div className="flex flex-col gap-0.5 text-xs">
                            <span>Account No: <span className="font-mono">{account.accountNo}</span></span>
                            <span>Customer: <span className="font-mono">{account.customerName}</span></span>
                            <span>Meter No: <span className="font-mono">{account.meterNo}</span></span>
                        </div>
                    </div>
                    <form onSubmit={handleEditSave}>
                        <input
                            type="text"
                            className="w-full p-2 rounded bg-slate-700 text-slate-100 mb-4 border border-slate-600 focus:border-cyan-400 outline-none"
                            value={editDisplayName}
                            onChange={e => setEditDisplayName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-700" onClick={handleEditCancel}>Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default AccountCard;