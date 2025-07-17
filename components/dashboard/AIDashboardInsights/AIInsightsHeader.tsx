import React from 'react';
import { WandSparklesIcon } from '../../common/Icons';

type AIInsightsHeaderProps = {
  aiSummary: { title: string; overallSummary: string };
  t: (key: string) => string;
};

const AIInsightsHeader: React.FC<AIInsightsHeaderProps> = ({ aiSummary, t }) => (
  <div className="flex items-start gap-3">
    <WandSparklesIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
    <div className="flex-1">
      <h3 className="text-xl font-bold text-white mb-2">{aiSummary.title}</h3>
      <p className="text-slate-300 mb-4">{aiSummary.overallSummary}</p>
    </div>
  </div>
);

export default AIInsightsHeader; 