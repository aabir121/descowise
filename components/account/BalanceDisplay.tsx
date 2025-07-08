import React from 'react';
import Spinner from '../common/Spinner';
import { BoltIcon } from '../common/Icons';

interface BalanceDisplayProps {
  isLoading: boolean;
  balance: number | null | undefined;
  readingTime?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ isLoading, balance, readingTime }) => {
  const hasBalance = balance !== null && balance !== undefined;
  const balanceValue = hasBalance ? parseFloat(String(balance).replace(/[^\d.-]/g, '')) : 0;
  const balanceDisplay = hasBalance ? `৳ ${balanceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  const balanceColor = !isNaN(balanceValue) && balanceValue >= 0 ? 'text-cyan-400' : 'text-red-400';

  if (isLoading) {
    return <Spinner size="w-7 h-7" color="border-slate-400" />;
  }

  return (
    <div className="text-right">
      <div className="flex items-center gap-1.5">
        <BoltIcon className={`w-5 h-5 ${balanceColor}`} />
        <span className={`font-bold text-2xl ${balanceColor}`}>{balanceDisplay}</span>
      </div>
      {readingTime && (
        <p className="text-xs text-slate-500 -mt-1">
          As of {new Date(readingTime).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default BalanceDisplay; 