import React from 'react';

interface AccountInfoRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

const AccountInfoRow: React.FC<AccountInfoRowProps> = ({ label, value, valueClassName = '' }) => (
  <div className="flex justify-between items-center">
    <span className="font-medium text-slate-400">{label}</span>
    <span className={`font-semibold text-slate-200 ${valueClassName}`}>{value}</span>
  </div>
);

export default AccountInfoRow; 