import React from 'react';
import { CloseIcon } from './Icons';
import { useModal } from '../../App';

interface SectionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionInfo: {
    title: string;
    description: string;
    benefits: string[];
    example?: string;
    useCase?: string;
    tips?: string[];
  };
  t: (key: string) => string;
}

const SectionInfoModal: React.FC<SectionInfoModalProps> = ({
  isOpen,
  onClose,
  sectionInfo,
  t
}) => {
  const Modal = useModal();

  // Ensure sectionInfo is not null and has required properties
  const safeSectionInfo = sectionInfo || {
    title: 'Section Information',
    description: 'Information about this section is not available.',
    benefits: ['Provides useful insights', 'Helps with analysis', 'Improves understanding'],
    example: 'This section helps you understand your electricity usage patterns.',
    useCase: 'Use this information to make informed decisions about your electricity consumption.',
    tips: ['Check this section regularly', 'Compare with previous periods', 'Look for patterns']
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">
            {t('sectionInfo')}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors p-1"
            aria-label={t('close')}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Section Title */}
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">
          {safeSectionInfo.title}
        </h3>

        {/* Description */}
        <p className="text-slate-300 mb-6 leading-relaxed">
          {safeSectionInfo.description}
        </p>

        {/* Practical Example */}
        {safeSectionInfo.example && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h5 className="text-cyan-400 font-medium mb-2">
              {t('practicalExample')}
            </h5>
            <p className="text-slate-300 text-sm">
              {safeSectionInfo.example}
            </p>
          </div>
        )}

        {/* Use Case */}
        {safeSectionInfo.useCase && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <h5 className="text-blue-400 font-medium mb-2">
              {t('whenToUse')}
            </h5>
            <p className="text-slate-300 text-sm">
              {safeSectionInfo.useCase}
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
            {t('keyBenefits')}
          </h4>
          <ul className="space-y-2">
            {safeSectionInfo.benefits.map((benefit, index) => (
              <li key={`benefit-${index}`} className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-slate-300 text-sm leading-relaxed">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Tips */}
        {safeSectionInfo.tips && safeSectionInfo.tips.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="text-green-400 font-medium mb-2">
              💡 {t('proTips')}
            </h5>
            <ul className="space-y-1">
              {safeSectionInfo.tips.map((tip, index) => (
                <li key={`tip-${index}`} className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-green-400 mt-1 flex-shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-8 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {t('gotIt')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SectionInfoModal; 