import React, { useState } from 'react';
import Spinner from '../common/Spinner';
import { BoltIcon, InformationCircleIcon } from '../common/Icons';
import { formatCurrency } from '../common/format';
import { formatHumanDate } from '../../utils/dataSanitization';
import Modal from '../common/Modal';
import BalanceInfoWarningModal from '../common/BalanceInfoWarningModal';

interface BalanceDisplayProps {
  isLoading: boolean;
  balance: string | number | null | undefined;
  readingTime?: string;
  naClassName?: string; // Add this prop
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ isLoading, balance, readingTime, naClassName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasBalance = balance !== null && balance !== undefined;
  const balanceValue = hasBalance ? parseFloat(String(balance).replace(/[^\d.-]/g, '')) : 0;
  const balanceDisplay = formatCurrency(balance);
  const balanceColor = !isNaN(balanceValue) && balanceValue >= 0 ? 'text-cyan-400' : 'text-red-400';

  if (isLoading) {
    return <Spinner size="w-7 h-7" color="border-slate-400" />;
  }

  if (!hasBalance) {
    return (
      <>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className={naClassName ? naClassName + " flex items-baseline" : "font-bold text-2xl text-yellow-400 flex items-baseline"}>
              N/A
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="p-1 rounded hover:bg-slate-700 focus:outline-none"
              aria-label="More information about unavailable balance"
            >
              <InformationCircleIcon className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
            </button>
          </div>
          <p className="text-xs text-yellow-400 mt-1">
            Balance information temporarily unavailable
          </p>
          {readingTime && (
            <p className="text-xs text-slate-500 mt-1">
              As of {formatHumanDate(new Date(readingTime))}
            </p>
          )}
        </div>
        
        <BalanceInfoWarningModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </>
    );
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