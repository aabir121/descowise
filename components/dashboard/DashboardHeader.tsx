import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '../../types';
import { ArrowLeftIcon, DotsVerticalIcon } from '../common/Icons';

import ShareModal from '../common/ShareModal';
import Notification from '../common/Notification';
import HelpModal from '../common/HelpModal';
import NotificationSettingsModal from '../NotificationSettingsModal';

import AccountTitle from './header/AccountTitle';
import DesktopActions from './header/DesktopActions';
import MobileMenu from './header/MobileMenu';
import AiCacheStatusIndicator from './header/AiCacheStatusIndicator';

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
    nextDailyReset: Date;
  };
  onForceRefreshAi?: () => void;
  isAiLoading?: boolean;
}> = ({ account, onClose, onDelete, setPortalConfirmation, onOpenApiKeyModal, isUsingCache, cacheStatus, onForceRefreshAi, isAiLoading }) => {
  const { t } = useTranslation();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isHelpTourOpen, setIsHelpTourOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleForceRefreshAi = () => {
    if (!onForceRefreshAi || isRefreshing || isAiLoading) return;

    try {
      setIsRefreshing(true);
      setNotification(t('refreshingAiInsights', 'Refreshing AI insights...'));
      onForceRefreshAi();

      // Clear refreshing state after a short delay to show feedback
      setTimeout(() => {
        setIsRefreshing(false);
        setNotification(t('aiInsightsRefreshed', 'AI insights refreshed successfully!'));
        
        // Clear the notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error('Error refreshing AI insights:', error);
      setNotification(t('aiRefreshError', 'Failed to refresh AI insights. Please try again.'));
      setIsRefreshing(false);
      
      // Clear error notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
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
            (!menuElement?.contains(target))) {
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
          <AccountTitle account={account} />
        </div>

        <DesktopActions
          onOpenApiKeyModal={onOpenApiKeyModal}
          cacheStatus={cacheStatus}
          isUsingCache={isUsingCache}
          onForceRefreshAi={handleForceRefreshAi}
          isRefreshing={isRefreshing}
          isAiLoading={isAiLoading}
          setIsNotificationSettingsOpen={setIsNotificationSettingsOpen}
          setIsHelpTourOpen={setIsHelpTourOpen}
          setPortalConfirmation={setPortalConfirmation}
          handleShare={handleShare}
          onDelete={() => onDelete(account.accountNo)}
        />

        {/* Mobile AI Cache Status Indicator (visible only on mobile/tablet) */}
        <div className="lg:hidden">
          <AiCacheStatusIndicator
            isUsingCache={isUsingCache}
            cacheStatus={cacheStatus}
            onForceRefreshAi={handleForceRefreshAi}
            isRefreshing={isRefreshing}
            isAiLoading={isAiLoading}
          />
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
          <MobileMenu
            isMenuOpen={isMenuOpen}
            menuPosition={menuPosition}
            onCloseMenu={() => setIsMenuOpen(false)}
            onOpenApiKeyModal={onOpenApiKeyModal}
            setIsNotificationSettingsOpen={setIsNotificationSettingsOpen}
            setIsHelpTourOpen={setIsHelpTourOpen}
            setPortalConfirmation={setPortalConfirmation}
            handleShare={handleShare}
            onDelete={() => onDelete(account.accountNo)}
          />
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