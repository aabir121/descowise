// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Account } from '../../types';
import { ArrowLeftIcon, TrashIcon, BuildingOfficeIcon, CogIcon, DotsVerticalIcon, ShareIcon, WandSparklesIcon } from '../common/Icons';
import IconButton from '../common/IconButton';
import SectionSettingsModal from '../common/SectionSettingsModal';
import ShareModal from '../common/ShareModal';
import Notification from '../common/Notification';
import ApiKeyStatusIndicator from '../common/ApiKeyStatusIndicator';

const DashboardHeader: React.FC<{
  account: Account;
  onClose: () => void;
  onDelete: (accountNo: string) => void;
  setPortalConfirmation: (state: { isOpen: boolean }) => void;
  onOpenApiKeyModal?: () => void;
}> = ({ account, onClose, onDelete, setPortalConfirmation, onOpenApiKeyModal }) => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

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
        if (!menuButtonRef.current.contains(target) &&
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
        {/* Desktop actions (inline) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
          <ApiKeyStatusIndicator
            variant="button"
            size="sm"
            onClick={onOpenApiKeyModal}
            showTooltip={true}
          />
          <IconButton
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-600/80 hover:bg-slate-500 text-white py-2 px-3 sm:px-4"
            title={t('sectionPreferencesAndSettings')}
          >
            <CogIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
              className="fixed w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col py-2"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                zIndex: 99999,
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
            </div>,
            document.body
          )}
        </div>
      </header>

      <SectionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        account={account}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        account={account}
      />
      {notification && <Notification message={notification} />}
    </>
  );
};

export default DashboardHeader; 