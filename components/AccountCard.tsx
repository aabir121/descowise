import React from 'react';
import { Account } from '../types';
import Spinner from './common/Spinner';
import { BoltIcon, TrashIcon } from './common/Icons';

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
            onClick={() => onSelect(account.accountNo)}
            className="relative bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer border border-slate-700 hover:border-cyan-500/50"
        >
            <button
                onClick={handleDeleteClick}
                title="Delete Account"
                className="absolute top-3 right-3 p-2 text-slate-500 hover:text-white hover:bg-red-500/80 rounded-full transition-colors duration-200 z-10"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-xl text-slate-100 truncate mb-4 pr-8">{displayName}</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-400">Account No:</span>
                    <span className="font-semibold text-slate-200">{account.accountNo}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-400">Customer:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[150px]">{account.customerName}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-400">Meter No:</span>
                    <span className="font-semibold text-slate-200">{account.meterNo}</span>
                </div>
                <div className="flex justify-between items-start pt-2 min-h-[50px]">
                    <span className="font-medium text-slate-400 text-base">Balance:</span>
                    {isBalanceLoading ? (
                        <Spinner size="w-7 h-7" color="border-slate-400" />
                    ) : (
                        <div className="text-right">
                            <div className="flex items-center gap-1.5">
                                <BoltIcon className={`w-5 h-5 ${balanceColor}`} />
                                <span className={`font-bold text-2xl ${balanceColor}`}>{balanceDisplay}</span>
                            </div>
                            {account.readingTime && (
                                <p className="text-xs text-slate-500 -mt-1">
                                    As of {new Date(account.readingTime).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountCard;