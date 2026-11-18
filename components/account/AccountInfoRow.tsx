import React from 'react';
import { CopyIcon, CheckIcon } from '../common/Icons';

interface AccountInfoRowProps {
  label: string;
  value: string;
  valueClassName?: string;
  onCopy?: () => void;
  copyStatus?: 'idle' | 'copied';
  t: (key: string, options?: any) => string;
}

const AccountInfoRow: React.FC<AccountInfoRowProps> = ({ label, value, valueClassName = '', onCopy, copyStatus = 'idle', t }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-x-3">
    <span className="font-medium text-slate-400">{label}</span>
    <div className="flex min-w-0 items-center justify-start gap-2 text-left">
      {onCopy && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onCopy?.(); }}
          className="shrink-0 rounded p-1 leading-none hover:bg-slate-700 focus:outline-none"
          title={copyStatus === 'copied' ? t('accountNumberCopied', { accountNo: value }) : t('copyAccountNo')}
          aria-label={copyStatus === 'copied' ? t('copied') : t('copyAccountNumber')}
        >
          {copyStatus === 'copied' ? (
            <CheckIcon className="w-4 h-4 text-green-500" />
          ) : (
            <CopyIcon className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
          )}
        </button>
      )}
      <span className={`min-w-0 whitespace-normal break-words font-semibold text-slate-200 ${valueClassName}`}>{value}</span>
    </div>
  </div>
);

export default AccountInfoRow;
