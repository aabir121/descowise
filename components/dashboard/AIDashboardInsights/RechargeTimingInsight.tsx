import React from 'react';

type RechargeTimingInsightProps = {
  insight: string;
  t: (key: string) => string;
};

const RechargeTimingInsight: React.FC<RechargeTimingInsightProps> = ({ insight, t }) => (
  <div className="bg-indigo-500/10 border border-indigo-500/20 border-l-4 border-l-indigo-400 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-indigo-400 mb-1">{t('optimalRechargeTiming')}</h4>
        <p className="text-sm text-indigo-300">{insight}</p>
      </div>
    </div>
  </div>
);

export default RechargeTimingInsight; 