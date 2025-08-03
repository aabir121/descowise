// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Account } from '../../types';
import { ArrowLeftIcon, TrashIcon, BuildingOfficeIcon, DotsVerticalIcon, ShareIcon, WandSparklesIcon, InformationCircleIcon, BellIcon } from '../common/Icons';
import IconButton from '../common/IconButton';

import ShareModal from '../common/ShareModal';
import Notification from '../common/Notification';
import ApiKeyStatusIndicator from '../common/ApiKeyStatusIndicator';
import HelpModal from '../common/HelpModal';
import NotificationSettingsModal from '../NotificationSettingsModal';

const DashboardHeader: React.FC<{
  account: Account;
  onClose: () => void;
  onDelete: (accountNo: string) => void;
  setPortalConfirmation: (state: { isOpen: boolean }) => void;
  onOpenApiKeyModal?: () => void;
  // AI Cache props
  isUsingCache?: boolean;
  cacheStatus?: {
    isCached: boolean;
    isStale: boolean;
    lastFetch: Date | null;
    timeRemaining: number;
  };
  onForceRefreshAi?: () => void;
}> = ({ account, onClose, onDelete, setPortalConfirmation, onOpenApiKeyModal, isUsingCache, cacheStatus, onForceRefreshAi }) => {
  const { t } = useTranslation();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isHelpTourOpen, setIsHelpTourOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Calculate menu position when opening
  const handleMenuToggle = () => {
    if (!isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 192px
      const menuHeight = 200; // Approximate height

      let top = rect.bottom + 8; // 8px gap
      let right = window.innerWidth - rect.right;

      // Ensure menu doesn't go off screen
      if (right + menuWidth > window.innerWidth) {
        right = 16; // 16px from right edge
      }

      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8; // Show above button
      }

      setMenuPosition({ top, right });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && menuButtonRef.current) {
        const target = event.target as Node;
        const menuElement = document.querySelector('[data-mobile-menu]');

        // Don't close if clicking on the menu button or inside the menu
        if (!menuButtonRef.current?.contains(target) &&
            (!menuElement || !menuElement.contains(target))) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="flex-shrink-0 bg-slate-800/70 backdrop-blur-lg p-3 sm:p-4 lg:p-5 flex justify-between items-center border-b border-slate-700 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 pr-2">
          <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="relative group min-w-0 flex-1">
            <h3
              className="text-lg sm:text-xl lg:text-2xl font-bold truncate"
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
        {/* Desktop actions - Reorganized with better hierarchy */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
          {/* Status Indicators Group */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-600">
            <ApiKeyStatusIndicator
              variant="button"
              size="sm"
              onClick={onOpenApiKeyModal}
              showTooltip={true}
            />

            {/* AI Cache Status Indicator */}
            {cacheStatus && (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                  isUsingCache
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-slate-700/50 text-slate-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isUsingCache ? 'bg-blue-400' : 'bg-slate-500'
                  }`} />
                  <span>
                    {isUsingCache ? t('cached') : t('fresh')} AI
                  </span>
                  {cacheStatus.isCached && (
                    <span className="text-slate-500">
                      ({cacheStatus.timeRemaining}m)
                    </span>
                  )}
                </div>

                {onForceRefreshAi && (
                  <button
                    onClick={onForceRefreshAi}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title={t('refreshAiInsights')}
                  >
                    <WandSparklesIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Primary Actions Group - Icons Only with Tooltips */}
          <div className="flex items-center gap-1">
            <IconButton
              onClick={() => setIsNotificationSettingsOpen(true)}
              className="bg-purple-600/80 hover:bg-purple-500 text-white p-2"
              title={t('notificationSettings', 'Notification Settings')}
            >
              <BellIcon className="w-5 h-5" />
            </IconButton>
            <IconButton
              onClick={() => setIsHelpTourOpen(true)}
              className="bg-blue-600/80 hover:bg-blue-500 text-white p-2"
              title={t('helpAndGuidance', 'Help & Guidance')}
            >
              <InformationCircleIcon className="w-5 h-5" />
            </IconButton>

          </div>

          {/* Secondary Actions Group - Icons Only with Tooltips */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-600">
            <IconButton
              onClick={() => setPortalConfirmation({ isOpen: true })}
              className="bg-cyan-500/80 hover:bg-cyan-600 text-white p-2"
              title={t('openDescoPortal')}
            >
              <BuildingOfficeIcon className="w-5 h-5" />
            </IconButton>
            <IconButton
              onClick={handleShare}
              className="bg-slate-500/80 hover:bg-slate-400 text-white p-2"
              title={t('shareDashboard') || 'Share'}
            >
              <ShareIcon className="w-5 h-5" />
            </IconButton>
            <IconButton
              onClick={() => onDelete(account.accountNo)}
              className="bg-red-500/80 hover:bg-red-600 text-white p-2"
              title={t('deleteAccount')}
            >
              <TrashIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
        {/* Mobile/tablet overflow menu */}
        <div className="relative lg:hidden flex-shrink-0">
          <button
            ref={menuButtonRef}
            onClick={handleMenuToggle}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label={t('showMoreActions')}
          >
            <DotsVerticalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          {isMenuOpen && createPortal(
            <div
              data-mobile-menu
              role="menu"
              tabIndex={0}
              className="fixed w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col py-2"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                zIndex: 99999,
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsMenuOpen(false);
                }
              }}
            >
              {/* Status & Management Section */}
              {onOpenApiKeyModal && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onOpenApiKeyModal) {
                      onOpenApiKeyModal();
                    }
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <WandSparklesIcon className="w-5 h-5" />
                  <span>{t('manageApiKey')}</span>
                </button>
              )}

              {/* Primary Actions Section */}
              <div className="border-t border-slate-600 my-1"></div>
              <button
                onClick={() => { setIsNotificationSettingsOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
              >
                <BellIcon className="w-5 h-5" />
                <span>{t('notificationSettings', 'Notification Settings')}</span>
              </button>
              <button
                onClick={() => { setIsHelpTourOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
              >
                <InformationCircleIcon className="w-5 h-5" />
                <span>{t('help', 'Help')}</span>
              </button>


              {/* Secondary Actions Section */}
              <div className="border-t border-slate-600 my-1"></div>
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

              {/* Destructive Actions Section */}
              <div className="border-t border-slate-600 my-1"></div>
              <button
                onClick={() => { onDelete(account.accountNo); setIsMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 text-left text-red-400 w-full"
              >
                <TrashIcon className="w-5 h-5" />
                <span>{t('delete')}</span>
              </button>
            </div>,
            document.body
          )}
        </div>
      </header>


      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        account={account}
      />
      <HelpModal
        isOpen={isHelpTourOpen}
        onClose={() => setIsHelpTourOpen(false)}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />
      {notification && <Notification message={notification} />}
    </>
  );
};

export default DashboardHeader; 