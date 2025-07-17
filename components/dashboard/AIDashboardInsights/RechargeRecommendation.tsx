import React from 'react';

type RechargeRecommendationProps = {
  justification: string;
  recommendedAmountBDT: number | null;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  sanitizeCurrency: (amount: number) => number;
};

const RechargeRecommendation: React.FC<RechargeRecommendationProps> = ({ justification, recommendedAmountBDT, t, formatCurrency, sanitizeCurrency }) => (
  <div className="bg-cyan-500/10 border border-cyan-500/20 border-l-4 border-l-cyan-400 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
      <div>
        <h4 className="font-semibold text-cyan-400 mb-1">{t('recommendedRecharge')}</h4>
        <p className="text-sm text-cyan-300">{justification}</p>
        {recommendedAmountBDT !== null && (
          <div className="mt-2 text-lg font-bold text-cyan-200">
            {t('suggestedRechargeAmount')} {formatCurrency(sanitizeCurrency(recommendedAmountBDT))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default RechargeRecommendation; 