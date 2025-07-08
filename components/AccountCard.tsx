import React from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import { BoltIcon, TrashIcon } from './common/Icons';
import { DeleteButton } from './common/Section';
import AccountInfoRow from './account/AccountInfoRow';
import BalanceDisplay from './account/BalanceDisplay';

interface AccountCardProps {
    account: Account;
    onSelect: (accountNo: string) => void;
    onDelete: (accountNo: string) => void;
    isBalanceLoading: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect, onDelete, isBalanceLoading }) => {
    const displayName = account.displayName || `Account ${account.accountNo}`;

    const hasBalance = account.balance !== null && account.balance !== undefined;

    const balanceValue = hasBalance ? parseFloat(String(account.balance).replace(/[^\d.-]/g, '')) : 0;
    const balanceDisplay = hasBalance ? `৳ ${balanceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A';

    const balanceColor = !isNaN(balanceValue) && balanceValue >= 0 ? 'text-cyan-400' : 'text-red-400';

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(account.accountNo);
    };

    return (
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
            <div className="flex items-center justify-between mb-4 pr-2">
                <h3 className="font-bold text-xl text-slate-100 truncate pr-4 max-w-[70%]">{displayName}</h3>
                <DeleteButton
                    onClick={handleDeleteClick}
                    title="Delete Account"
                    className="flex-shrink-0"
                >
                    <TrashIcon className="w-5 h-5" />
                </DeleteButton>
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
    );
};

export default AccountCard;