import React, { useState } from 'react';
import Spinner from '../common/Spinner';
import { BoltIcon, InformationCircleIcon } from '../common/Icons';
import { formatCurrency } from '../common/format';
import { formatHumanDate } from '../../utils/dataSanitization';
import Modal from '../common/Modal';

interface BalanceDisplayProps {
  isLoading: boolean;
  balance: string | number | null | undefined;
  readingTime?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ isLoading, balance, readingTime }) => {
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
            <span className="font-bold text-2xl text-yellow-400 flex items-baseline">
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
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <InformationCircleIcon className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-slate-100">Balance Information Unavailable</h3>
            </div>
            <div className="text-slate-300 text-sm space-y-3">
              <p>
                We're unable to display your current balance at this time. This could be due to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Temporary service maintenance</li>
                <li>Account status changes</li>
                <li>Network connectivity issues</li>
                <li>Recent meter reading updates</li>
              </ul>
              <p className="text-slate-400 text-xs mt-4">
                Your balance information will be updated automatically once available. You can also check your balance directly through the official DESCO portal.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </Modal>
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