import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, CogIcon, WandSparklesIcon, ChevronDownIcon } from '../common/Icons';
import ApiKeySettingsSection from './ApiKeySettingsSection';
import SectionSettingsModal from '../common/SectionSettingsModal';
import { useModal } from '../../App';

interface ComprehensiveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal: () => void;
}

type SettingsTab = 'general' | 'ai' | 'sections';

const ComprehensiveSettingsModal: React.FC<ComprehensiveSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenApiKeyModal
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showSectionSettings, setShowSectionSettings] = useState(false);
  const Modal = useModal();

  const tabs = [
    { id: 'general' as SettingsTab, label: t('general', 'General'), icon: CogIcon },
    { id: 'ai' as SettingsTab, label: t('aiFeatures', 'AI Features'), icon: WandSparklesIcon },
    { id: 'sections' as SettingsTab, label: t('sections', 'Sections'), icon: ChevronDownIcon }
  ];

  const handleTabChange = (tabId: SettingsTab) => {
    if (tabId === 'sections') {
      setShowSectionSettings(true);
      return;
    }
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div className="space-y-6">
            <ApiKeySettingsSection 
              onOpenApiKeyModal={onOpenApiKeyModal}
              showTitle={false}
            />
          </div>
        );
      
      case 'general':
      default:
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <CogIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                {t('generalSettings', 'General Settings')}
              </h3>
              <p className="text-slate-400 text-sm">
                {t('generalSettingsDescription', 'General application settings and preferences will be available here.')}
              </p>
            </div>
          </div>
        );
    }
  };

  if (showSectionSettings) {
    return (
      <SectionSettingsModal 
        isOpen={isOpen} 
        onClose={() => {
          setShowSectionSettings(false);
          onClose();
        }} 
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <CogIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-slate-100">{t('settings', 'Settings')}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label={t('close', 'Close')}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                isActive
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-600'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-300 hover:text-slate-100 font-medium transition-colors"
        >
          {t('close', 'Close')}
        </button>
      </div>
    </Modal>
  );
};

export default ComprehensiveSettingsModal;
