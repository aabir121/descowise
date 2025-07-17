import React from 'react';

type BalanceStatusAndAdviceProps = {
  status: 'low' | 'normal' | 'good' | string;
  details: string;
  t: (key: string) => string;
};

const BalanceStatusAndAdvice: React.FC<BalanceStatusAndAdviceProps> = ({ status, details, t }) => {
  const statusKey =
    status === 'low'
      ? 'statusLow'
      : status === 'normal'
      ? 'statusNormal'
      : status === 'good'
      ? 'statusGood'
      : 'statusUnknown';

  return (
    <div className={`rounded-lg p-4 border-l-4 ${
      status === 'low' ? 'bg-red-500/10 border-red-500/20 border-l-red-400' :
      status === 'normal' ? 'bg-yellow-500/10 border-yellow-500/20 border-l-yellow-400' :
      'bg-green-500/10 border-green-500/20 border-l-green-400'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
          status === 'low' ? 'bg-red-400' :
          status === 'normal' ? 'bg-yellow-400' :
          'bg-green-400'
        }`} />
        <div>
          <h4 className={`font-semibold mb-1 ${
            status === 'low' ? 'text-red-400' :
            status === 'normal' ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {t('balanceStatus')}: {status ? t(statusKey) : t('statusUnknown')}
          </h4>
          <p className="text-sm text-slate-300">{details}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceStatusAndAdvice; 