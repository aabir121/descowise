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
    <div className={`bg-slate-800/50 border border-slate-600 rounded-xl p-1 ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`
                relative p-3 sm:p-4 rounded-lg transition-all duration-200 text-left
                ${isActive 
                  ? 'bg-cyan-600 text-white shadow-lg transform scale-[1.02]' 
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
                }
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50
              `}
              title={tab.description}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-medium text-sm sm:text-base">{tab.label}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isActive ? 'text-cyan-100' : 'text-slate-400'}`}>
                  {tab.count} {t('sections')}
                </span>
                
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </div>
              
              {/* Mobile: Show description on active tab */}
              {isActive && (
                <div className="sm:hidden mt-2 pt-2 border-t border-cyan-400/20">
                  <p className="text-xs text-cyan-100 leading-relaxed">
                    {tab.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Desktop: Show description below tabs */}
      <div className="hidden sm:block mt-3 pt-3 border-t border-slate-600">
        <p className="text-sm text-slate-400 text-center">
          {tabs.find(tab => tab.id === activeView)?.description}
        </p>
      </div>
    </div>
  );
};

export default DashboardTabs;
