import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { BuildingOfficeIcon, ShareIcon, TrashIcon, WandSparklesIcon, InformationCircleIcon, BellIcon } from '../../common/Icons';

interface MobileMenuProps {
  isMenuOpen: boolean;
  menuPosition: { top: number; right: number };
  onCloseMenu: () => void;
  onOpenApiKeyModal?: () => void;
  setIsNotificationSettingsOpen: (isOpen: boolean) => void;
  setIsHelpTourOpen: (isOpen: boolean) => void;
  setPortalConfirmation: (state: { isOpen: boolean }) => void;
  handleShare: () => void;
  onDelete: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isMenuOpen,
  menuPosition,
  onCloseMenu,
  onOpenApiKeyModal,
  setIsNotificationSettingsOpen,
  setIsHelpTourOpen,
  setPortalConfirmation,
  handleShare,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (!isMenuOpen) return null;

  return createPortal(
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
          onCloseMenu();
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
            onCloseMenu();
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
        onClick={() => { setIsNotificationSettingsOpen(true); onCloseMenu(); }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
      >
        <BellIcon className="w-5 h-5" />
        <span>{t('notificationSettings', 'Notification Settings')}</span>
      </button>
      <button
        onClick={() => { setIsHelpTourOpen(true); onCloseMenu(); }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
      >
        <InformationCircleIcon className="w-5 h-5" />
        <span>{t('help', 'Help')}</span>
      </button>

      {/* Secondary Actions Section */}
      <div className="border-t border-slate-600 my-1"></div>
      <button
        onClick={() => { setPortalConfirmation({ isOpen: true }); onCloseMenu(); }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
      >
        <BuildingOfficeIcon className="w-5 h-5" />
        <span>{t('officialPortal')}</span>
      </button>
      <button
        onClick={() => { handleShare(); onCloseMenu(); }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 text-left text-white w-full"
      >
        <ShareIcon className="w-5 h-5" />
        <span>{t('share') || 'Share'}</span>
      </button>

      {/* Destructive Actions Section */}
      <div className="border-t border-slate-600 my-1"></div>
      <button
        onClick={() => { onDelete(); onCloseMenu(); }}
        className="flex items-center gap-2 px-4 py-2 hover:bg-red-600 text-left text-red-400 w-full"
      >
        <TrashIcon className="w-5 h-5" />
        <span>{t('delete')}</span>
      </button>
    </div>,
    document.body
  );
};

export default MobileMenu;
