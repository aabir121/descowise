// @ts-nocheck
import React, { useState } from 'react';
import { Account } from '../../types';
import { ArrowLeftIcon, TrashIcon, BuildingOfficeIcon, CogIcon } from '../common/Icons';
import IconButton from '../common/IconButton';
import SectionSettingsModal from '../common/SectionSettingsModal';

const DashboardHeader: React.FC<{ account: Account; onClose: () => void; onDelete: (accountNo: string) => void; setPortalConfirmation: (state: { isOpen: boolean }) => void }> = ({ account, onClose, onDelete, setPortalConfirmation }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex-shrink-0 bg-slate-800/70 backdrop-blur-lg p-4 sm:p-5 flex justify-between items-center border-b border-slate-700 sticky top-0">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h3 className="text-xl sm:text-2xl font-bold truncate">{account.displayName || `Account ${account.accountNo}`}</h3>
        </div>
        <div className="flex items-center gap-3">
          <IconButton
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-600/80 hover:bg-slate-500 text-white py-2 px-4"
            title="Section preferences and settings"
          >
            <CogIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Settings</span>
          </IconButton>
          <IconButton
            onClick={() => setPortalConfirmation({ isOpen: true })}
            className="bg-cyan-500/80 hover:bg-cyan-600 text-white py-2 px-4"
            title="Copy account ID and open official DESCO customer portal"
          >
            <BuildingOfficeIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Official Portal</span>
          </IconButton>
          <IconButton
            onClick={() => onDelete(account.accountNo)}
            className="bg-red-500/80 hover:bg-red-600 text-white py-2 px-4"
            title="Delete this account"
          >
            <TrashIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Delete</span>
          </IconButton>
        </div>
      </header>
      
            <SectionSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default DashboardHeader; 