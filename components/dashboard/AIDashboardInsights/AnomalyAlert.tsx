import React from 'react';

type AnomalyAlertProps = {
  details: string;
  t: (key: string) => string;
};

const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ details, t }) => (
  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-amber-400 mb-1">{t('anomalyDetected')}</h4>
        <p className="text-sm text-amber-300">{details}</p>
      </div>
    </div>
  </div>
);

export default AnomalyAlert; 