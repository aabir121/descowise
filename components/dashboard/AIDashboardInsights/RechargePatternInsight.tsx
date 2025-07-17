import React from 'react';

type RechargePatternInsightProps = {
  insight: string;
  t: (key: string) => string;
};

const RechargePatternInsight: React.FC<RechargePatternInsightProps> = ({ insight, t }) => (
  <div className="bg-slate-700/30 rounded-lg p-4">
    <h4 className="font-semibold text-slate-200 mb-2">{t('rechargePattern')}</h4>
    <p className="text-sm text-slate-300">{insight}</p>
  </div>
);

export default RechargePatternInsight; 