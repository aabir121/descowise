import React from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '../../../types';

interface AccountTitleProps {
  account: Account;
}

const AccountTitle: React.FC<AccountTitleProps> = ({ account }) => {
  const { t } = useTranslation();

  return (
    <div className="relative group min-w-0 flex-1">
      <h3
        className="text-lg sm:text-xl lg:text-2xl font-bold truncate"
        title={account.displayName || `${t('account')} ${account.accountNo}`}
      >
        {account.displayName || `${t('account')} ${account.accountNo}`}
      </h3>
      {/* Tooltip for full title on hover (desktop) */}
      <span className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
        {account.displayName || `${t('account')} ${account.accountNo}`}
      </span>
    </div>
  );
};

export default AccountTitle;
