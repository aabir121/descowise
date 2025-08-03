import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, BellIcon, ExclamationTriangleIcon, InformationCircleIcon } from './common/Icons';
import { notificationPermissionService, NotificationPermissionStatus } from '../services/notificationPermissionService';
import { notificationScheduler } from '../services/notificationScheduler';
import { notificationStorageService } from '../services/notificationStorageService';
import Spinner from './common/Spinner';
import { useTranslation } from 'react-i18next';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const [localSettings, setLocalSettings] = useState(notificationPermissionService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [monitoringStats, setMonitoringStats] = useState(notificationStorageService.getTodaysSummary());
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    nextScheduledTime: '',
    timeUntilNext: '',
  });

  const updateSchedulerStatus = useCallback(() => {
    setSchedulerStatus({
      isRunning: notificationScheduler.isRunning(),
      nextScheduledTime: notificationScheduler.getNextScheduledTime(),
      timeUntilNext: notificationScheduler.getTimeUntilNext(),
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = notificationPermissionService.subscribe(setPermissionStatus);
      setLocalSettings(notificationPermissionService.getSettings());
      updateSchedulerStatus();
      setMonitoringStats(notificationStorageService.getTodaysSummary());
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        unsubscribe();
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose, updateSchedulerStatus]);

  const handleSettingsChange = (updates: Partial<typeof localSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const originalSettings = notificationPermissionService.getSettings();

    try {
      if (localSettings.enabled && !originalSettings.enabled) {
        const success = await notificationPermissionService.enableNotifications();
        if (success) {
          notificationPermissionService.updateSettings(localSettings);
        } else {
          alert('Failed to enable notifications. Please check your browser settings.');
          setIsLoading(false);
          return;
        }
      } else if (!localSettings.enabled && originalSettings.enabled) {
        notificationPermissionService.disableNotifications();
      } else {
        notificationPermissionService.updateSettings(localSettings);
      }
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Error saving settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowExampleNotification = async () => {
    setIsLoading(true);
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(t('exampleNotificationTitle'), {
          body: t('exampleNotificationBody'),
          icon: '/icon-192x192.png',
          badge: '/favicon.svg',
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else {
        alert(t('notificationsNotGranted'));
      }
    } catch (error) {
      alert(`${t('errorShowingExampleNotification')}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const statusInfo = {
    text: permissionStatus.charAt(0).toUpperCase() + permissionStatus.slice(1),
    color: permissionStatus === 'granted' ? 'text-green-400' : permissionStatus === 'denied' ? 'text-red-400' : 'text-yellow-400',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md mx-auto border border-slate-700 shadow-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-100">{t('notificationSettings')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><CloseIcon className="w-6 h-6" /></button>
        </div>

        <div className="px-4 sm:px-6 pb-0 overflow-y-auto flex-1 space-y-6">
          {/* Section: Notification Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">{t('notificationStatus')}</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">{t('permissionStatus')}</h4>
              <div className={`text-sm font-medium ${statusInfo.color}`}>{t(permissionStatus)}</div>
            </div>

            <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 flex items-start gap-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-400 font-medium">{t('localNotificationDisclaimer')}</p>
              </div>
            </div>

            {permissionStatus === 'denied' && (
              <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3 flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">{t('notificationsBlocked')}</p>
                  <p className="text-xs text-red-300 mt-1">{t('enableNotificationsInBrowser')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Notification Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">{t('notificationPreferences')}</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-300">{t('dailyNotifications')}</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.enabled}
                    onChange={(e) => handleSettingsChange({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-slate-400">{t('notificationDescription')}</p>
            </div>

            {localSettings.enabled && (
              <>
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">{t('lowBalanceThreshold')}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">৳</span>
                    <input
                      type="number"
                      value={localSettings.lowBalanceThreshold}
                      onChange={(e) => handleSettingsChange({ lowBalanceThreshold: Number(e.target.value) })}
                      className="flex-1 bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm w-full"
                      min="0" max="10000" step="10"
                      pattern="[0-9]*"
                    />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">{t('notificationTime')}</h4>
                  <input
                    type="time"
                    value={localSettings.notificationTime}
                    onChange={(e) => handleSettingsChange({ notificationTime: e.target.value })}
                    className="w-full bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Section: Testing & Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">{t('testingAndActivity')}</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">{t('schedulerStatus')}</h4>
              <div className="space-y-1 text-xs text-slate-400">
                <div>{t('status')}: <span className={schedulerStatus.isRunning ? 'text-green-400' : 'text-red-400'}>{schedulerStatus.isRunning ? t('running') : t('stopped')}</span></div>
                {schedulerStatus.isRunning && (
                  <>
                    <div>{t('nextCheck')}: {schedulerStatus.nextScheduledTime}</div>
                    <div>{t('timeUntilNext')}: {schedulerStatus.timeUntilNext}</div>
                  </>
                )}
              </div>
            </div>

            {monitoringStats && (
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">{t('todaysActivity')}</h4>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>{t('notificationsSent')}: {monitoringStats.notifications.length}</div>
                  {monitoringStats.lastCheckTime && (
                    <div>{t('lastCheck')}: {new Date(monitoringStats.lastCheckTime).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <button onClick={handleShowExampleNotification} disabled={isLoading || permissionStatus !== 'granted'} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Spinner size="sm" /> : t('showExampleNotification')}
              </button>
            </div>

            {testNotificationSent && <div className="bg-green-600/20 text-green-400 text-sm p-3 rounded-lg">{t('testNotificationSent')}</div>}
          </div>
        </div>

        <div className="flex-shrink-0 p-4 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isLoading && <Spinner size="sm" />} {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;