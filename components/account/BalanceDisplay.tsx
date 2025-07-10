import React from 'react';
import Spinner from '../common/Spinner';
import { BoltIcon } from '../common/Icons';
import { formatCurrency } from '../common/format';
import { formatHumanDate } from '../../utils/dataSanitization';

interface BalanceDisplayProps {
  isLoading: boolean;
  balance: number | null | undefined;
  readingTime?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ isLoading, balance, readingTime }) => {
  const hasBalance = balance !== null && balance !== undefined;
  const balanceValue = hasBalance ? parseFloat(String(balance).replace(/[^\d.-]/g, '')) : 0;
  const balanceDisplay = formatCurrency(balance);
  const balanceColor = !isNaN(balanceValue) && balanceValue >= 0 ? 'text-cyan-400' : 'text-red-400';

  if (isLoading) {
    return <Spinner size="w-7 h-7" color="border-slate-400" />;
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        <BoltIcon className={`w-5 h-5 mt-0.5 ${balanceColor}`} />
        <span className={`font-bold text-2xl ${balanceColor} flex items-baseline`}>
          <span className="mr-0.5">৳</span>
          <span>{balanceDisplay.replace(/^৳/, '')}</span>
        </span>
      </div>
      {readingTime && (
        <p className="text-xs text-slate-500 mt-1">
          As of {formatHumanDate(new Date(readingTime))}
        </p>
      )}
    </div>
  );
};

export default BalanceDisplay; 