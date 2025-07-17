import React from 'react';

type SeasonalTrendProps = {
  details: string;
  t: (key: string) => string;
};

const SeasonalTrend: React.FC<SeasonalTrendProps> = ({ details, t }) => (
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-blue-400 mb-1">{t('seasonalPattern')}</h4>
        <p className="text-sm text-blue-300">{details}</p>
      </div>
    </div>
  </div>
);

export default SeasonalTrend; 