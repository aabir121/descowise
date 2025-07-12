// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useSectionPreferences } from './Section';
import { CogIcon } from './Icons';

interface SectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define all possible sections with their IDs and labels
// Note: ai-powered-insights is excluded as it's always expanded
const SECTION_CONFIGS = [
  { id: 'account-balance-status', label: 'Account Balance & Status', defaultOpen: true },
  { id: 'consumption-chart', label: 'Consumption Chart', defaultOpen: true },
  { id: 'comparison-chart', label: 'Comparison Chart', defaultOpen: true },
  { id: 'recharge-vs-consumption', label: 'Recharge vs Consumption', defaultOpen: true },
  { id: 'recharge-distribution', label: 'Recharge Distribution', defaultOpen: true },
  { id: 'max-demand', label: 'Max Demand', defaultOpen: true },
  { id: 'cumulative-consumption', label: 'Cumulative Consumption', defaultOpen: true },
  { id: 'box-plot', label: 'Box Plot Analysis', defaultOpen: true },
  { id: 'monthly-cost-trend', label: 'Monthly Cost Trend', defaultOpen: true },
  { id: 'recharge-history', label: 'Recharge History', defaultOpen: true },
  { id: 'consumer-information', label: 'Consumer Information', defaultOpen: true },
];

const SectionSettingsModal: React.FC<SectionSettingsModalProps> = ({ isOpen, onClose }) => {
  const { getSectionPreference, setSectionPreference, resetAllPreferences } = useSectionPreferences();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentPrefs: Record<string, boolean> = {};
      SECTION_CONFIGS.forEach(config => {
        currentPrefs[config.id] = getSectionPreference(config.id, config.defaultOpen);
      });
      setPreferences(currentPrefs);
      setHasChanges(false);
      setSearch('');
    }
  }, [isOpen, getSectionPreference]);

  const handlePreferenceChange = (sectionId: string, isOpen: boolean) => {
    setPreferences(prev => ({ ...prev, [sectionId]: isOpen }));
    setHasChanges(true);
  };

  const handleSave = () => {
    Object.entries(preferences).forEach(([sectionId, isOpen]) => {
      setSectionPreference(sectionId, isOpen);
    });
    setHasChanges(false);
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('section-preferences-updated'));
    onClose(); // Close immediately after saving
  };

  const handleReset = () => {
    const defaultPrefs: Record<string, boolean> = {};
    SECTION_CONFIGS.forEach(config => {
      defaultPrefs[config.id] = config.defaultOpen;
    });
    setPreferences(defaultPrefs);
    setHasChanges(true);
  };

  const handleResetAll = () => {
    resetAllPreferences();
    const defaultPrefs: Record<string, boolean> = {};
    SECTION_CONFIGS.forEach(config => {
      defaultPrefs[config.id] = config.defaultOpen;
    });
    setPreferences(defaultPrefs);
    setHasChanges(false);
  };

  // No confirmation dialog, just close
  const handleClose = () => {
    onClose();
  };

  // Filtered sections
  const filteredSections = SECTION_CONFIGS.filter(config =>
    config.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={null}>
      {/* Custom header with close button */}
      <div className="flex items-center justify-between mb-2 px-2 pt-2">
        <h2 className="text-base font-semibold text-slate-100">Section Preferences</h2>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="p-2 rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L14 14M14 6L6 14" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="space-y-4 p-2 sm:p-4 max-w-sm w-full mx-auto">
        <div className="text-xs text-slate-300 leading-relaxed mb-1">
          Choose which sections you want to see expanded by default. Your preferences will be remembered across sessions.
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sections..."
          className="w-full px-2 py-1.5 rounded bg-slate-800 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm mb-2"
          aria-label="Search sections"
        />
        <div className="divide-y divide-slate-700 max-h-64 overflow-y-auto custom-scrollbar">
          {filteredSections.length === 0 && (
            <div className="text-slate-400 text-center py-6 text-sm">No sections found.</div>
          )}
          {filteredSections.map(config => (
            <label
              key={config.id}
              className="flex items-center justify-between py-2 px-1 cursor-pointer select-none"
            >
              <span className="text-slate-100 text-sm font-medium pr-2 truncate">
                {config.label}
              </span>
              <input
                type="checkbox"
                checked={preferences[config.id]}
                onChange={e => handlePreferenceChange(config.id, e.target.checked)}
                className="toggle-checkbox h-5 w-10 rounded-full border-2 border-slate-500 bg-slate-700 focus:ring-cyan-500 transition-colors"
                aria-label={preferences[config.id] ? 'Section visible' : 'Section hidden'}
              />
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-700 mt-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
              ${hasChanges ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
          >
            {hasChanges ? 'Save Changes' : 'No Changes to Save'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 px-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium border border-slate-600"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleResetAll}
              className="flex-1 px-2 py-2 bg-red-700/20 hover:bg-red-700/40 text-red-300 rounded-lg text-xs font-medium border border-red-700/30"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .max-w-sm { max-width: 100vw !important; }
          .p-2, .sm\:p-4 { padding: 0.5rem !important; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        .toggle-checkbox {
          accent-color: #06b6d4;
        }
      `}</style>
    </Modal>
  );
};

export default SectionSettingsModal; 