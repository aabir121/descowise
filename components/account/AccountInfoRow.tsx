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
  <div className="flex justify-between items-center">
    <span className="font-medium text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="p-1 rounded hover:bg-slate-700 focus:outline-none"
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
      <span className={`font-semibold text-slate-200 ${valueClassName}`}>{value}</span>
    </div>
  </div>
);

export default AccountInfoRow;