import React from 'react';

type ActionableTipProps = {
  tip: string;
  t: (key: string) => string;
};

const ActionableTip: React.FC<ActionableTipProps> = ({ tip, t }) => (
  <div className="flex items-start gap-3">
    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
    <div>
      <h4 className="font-semibold text-purple-400 mb-1">{t('actionableTip')}</h4>
      <p className="text-sm text-purple-300">{tip}</p>
    </div>
  </div>
);

export default ActionableTip; 