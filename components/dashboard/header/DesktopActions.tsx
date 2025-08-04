import React from 'react';
import { useTranslation } from 'react-i18next';
import IconButton from '../../common/IconButton';
import ApiKeyStatusIndicator from '../../common/ApiKeyStatusIndicator';
import { BuildingOfficeIcon, ShareIcon, TrashIcon, BellIcon, InformationCircleIcon } from '../../common/Icons';
import AiCacheStatusIndicator from './AiCacheStatusIndicator';

interface DesktopActionsProps {
  onOpenApiKeyModal?: () => void;
  cacheStatus?: {
    isCached: boolean;
    isStale: boolean;
    lastFetch: Date | null;
    timeRemaining: number;
    nextDailyReset: Date;
  };
  isUsingCache?: boolean;
  onForceRefreshAi?: () => void;
  isRefreshing?: boolean;
  isAiLoading?: boolean;
  setIsNotificationSettingsOpen: (isOpen: boolean) => void;
  setIsHelpTourOpen: (isOpen: boolean) => void;
  setPortalConfirmation: (state: { isOpen: boolean }) => void;
  handleShare: () => void;
  onDelete: () => void;
}

const DesktopActions: React.FC<DesktopActionsProps> = ({
  onOpenApiKeyModal,
  cacheStatus,
  isUsingCache,
  onForceRefreshAi,
  isRefreshing,
  isAiLoading,
  setIsNotificationSettingsOpen,
  setIsHelpTourOpen,
  setPortalConfirmation,
  handleShare,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
      {/* Status Indicators Group */}
      <div className="flex items-center gap-2 pr-2 border-r border-slate-600">
        <ApiKeyStatusIndicator
          variant="button"
          size="sm"
          onClick={onOpenApiKeyModal}
          showTooltip={true}
        />
        <AiCacheStatusIndicator
          isUsingCache={isUsingCache}
          cacheStatus={cacheStatus}
          onForceRefreshAi={onForceRefreshAi}
          isRefreshing={isRefreshing}
          isAiLoading={isAiLoading}
        />
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
          onClick={onDelete}
          className="bg-red-500/80 hover:bg-red-600 text-white p-2"
          title={t('deleteAccount')}
        >
          <TrashIcon className="w-5 h-5" />
        </IconButton>
      </div>
    </div>
  );
};

export default DesktopActions;
