// @ts-nocheck
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '../../types';
import { ArrowLeftIcon, TrashIcon, BuildingOfficeIcon, CogIcon, DotsVerticalIcon, ShareIcon } from '../common/Icons';
import IconButton from '../common/IconButton';
import SectionSettingsModal from '../common/SectionSettingsModal';
import Notification from '../common/Notification';

const DashboardHeader: React.FC<{ account: Account; onClose: () => void; onDelete: (accountNo: string) => void; setPortalConfirmation: (state: { isOpen: boolean }) => void }> = ({ account, onClose, onDelete, setPortalConfirmation }) => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = React.useRef(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/${account.accountNo}?shared=1`;
    try {
      await navigator.clipboard.writeText(url);
      setNotification('Link copied!');
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setNotification('Failed to copy link');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <>
      <header className="flex-shrink-0 bg-slate-800/70 backdrop-blur-lg p-4 sm:p-5 flex justify-between items-center border-b border-slate-700 sticky top-0">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="relative group max-w-xs sm:max-w-md">
            <h3
              className="text-xl sm:text-2xl font-bold truncate max-w-[140px] sm:max-w-[300px]"
              title={account.displayName || `${t('account')} ${account.accountNo}`}
            >
              {account.displayName || `${t('account')} ${account.accountNo}`}
            </h3>
            {/* Tooltip for full title on hover (desktop) */}
            <span className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
              {account.displayName || `${t('account')} ${account.accountNo}`}
            </span>
          </div>
        </div>
        {/* Desktop actions (inline) */}
        <div className="hidden sm:flex items-center gap-3">
          <IconButton
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-600/80 hover:bg-slate-500 text-white py-2 px-4"
            title={t('sectionPreferencesAndSettings')}
          >
            <CogIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('settings')}</span>
          </IconButton>
          <IconButton
            onClick={() => setPortalConfirmation({ isOpen: true })}
            className="bg-cyan-500/80 hover:bg-cyan-600 text-white py-2 px-4"
            title={t('openDescoPortal')}
          >
            <BuildingOfficeIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('officialPortal')}</span>
          </IconButton>
          <IconButton
            onClick={handleShare}
            className="bg-slate-500/80 hover:bg-slate-400 text-white py-2 px-4"
            title={t('shareDashboard') || 'Share'}
          >
            <ShareIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('share') || 'Share'}</span>
          </IconButton>
          <IconButton
            onClick={() => onDelete(account.accountNo)}
            className="bg-red-500/80 hover:bg-red-600 text-white py-2 px-4"
            title={t('deleteAccount')}
          >
            <TrashIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('delete')}</span>
          </IconButton>
        </div>
        {/* Mobile overflow menu */}
        <div className="relative sm:hidden">
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((v) => !v)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label={t('showMoreActions')}
          >
            <DotsVerticalIcon className="w-6 h-6" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 flex flex-col py-2"
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button
                onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
              >
                <CogIcon className="w-5 h-5" />
                <span>{t('settings')}</span>
              </button>
              <button
                onClick={() => { setPortalConfirmation({ isOpen: true }); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
              >
                <BuildingOfficeIcon className="w-5 h-5" />
                <span>{t('officialPortal')}</span>
              </button>
              <button
                onClick={() => { handleShare(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
              >
                <ShareIcon className="w-5 h-5" />
                <span>{t('share') || 'Share'}</span>
              </button>
              <button
                onClick={() => { onDelete(account.accountNo); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 text-left text-red-400 w-full"
              >
                <TrashIcon className="w-5 h-5" />
                <span>{t('delete')}</span>
              </button>
            </div>
          )}
        </div>
      </header>
      
            <SectionSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      {notification && <Notification message={notification} />}
    </>
  );
};

export default DashboardHeader; 