// @ts-nocheck
import React from 'react';
import { HomeIcon, ChartBarIcon, ClockIcon, ViewColumnsIcon } from '../common/Icons';

interface DashboardTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
  t: (key: string) => string;
  className?: string;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeView,
  onViewChange,
  t,
  className = ''
}) => {
  const tabs = [
    {
      id: 'essential',
      label: t('essential'),
      icon: HomeIcon,
      description: t('essentialViewDesc'),
      count: 4 // Essential sections count
    },
    {
      id: 'analysis',
      label: t('analysis'),
      icon: ChartBarIcon,
      description: t('analysisViewDesc'),
      count: 3 // Analysis sections count
    },
    {
      id: 'history',
      label: t('history'),
      icon: ClockIcon,
      description: t('historyViewDesc'),
      count: 5 // History sections count
    },
    {
      id: 'all',
      label: t('allSections'),
      icon: ViewColumnsIcon,
      description: t('allViewDesc'),
      count: 12 // All sections count
    }
  ];

  return (
    <div className={`rounded-2xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-lg backdrop-blur-sm ${className}`}>
      <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onViewChange(tab.id);
              }}
              className={`
                relative min-w-[7.2rem] flex-1 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:min-w-0 sm:p-3
                ${isActive
                  ? 'bg-cyan-600 text-white shadow-lg transform scale-[1.02]'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
                }
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50
              `}
              title={tab.description}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap text-xs font-semibold sm:text-sm">{tab.label}</span>
              </div>
              
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-[10px] ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                  {tab.count} {t('sections')}
                </span>
                
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-2 hidden border-t border-slate-700 pt-2 sm:block">
        <p className="text-sm text-slate-400 text-center">
          {tabs.find(tab => tab.id === activeView)?.description}
        </p>
      </div>
    </div>
  );
};

export default DashboardTabs;
