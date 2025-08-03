import React, { useState, useEffect } from 'react';
import { CloseIcon, BellIcon, ExclamationTriangleIcon } from './common/Icons';
import { notificationPermissionService, NotificationPermissionStatus } from '../services/notificationPermissionService';
import { notificationScheduler } from '../services/notificationScheduler';
import { notificationStorageService } from '../services/notificationStorageService';
import Spinner from './common/Spinner';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useTranslation } from 'react-i18next';

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const [settings, setSettings] = useState(notificationPermissionService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    nextScheduledTime: '',
    timeUntilNext: '',
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Subscribe to permission status changes
      const unsubscribe = notificationPermissionService.subscribe(setPermissionStatus);
      
      // Update settings
      setSettings(notificationPermissionService.getSettings());
      
      // Update scheduler status
      updateSchedulerStatus();
      
      return unsubscribe;
    }
  }, [isOpen]);

  const updateSchedulerStatus = () => {
    setSchedulerStatus({
      isRunning: notificationScheduler.isRunning(),
      nextScheduledTime: notificationScheduler.getNextScheduledTime(),
      timeUntilNext: notificationScheduler.getTimeUntilNext(),
    });
  };

  const handleEnableNotifications = async () => {
    console.log('Enabling notifications...');
    setIsLoading(true);
    try {
      const success = await notificationPermissionService.enableNotifications();
      console.log('Enable notifications result:', success);
      if (success) {
        setSettings(notificationPermissionService.getSettings());
        updateSchedulerStatus();
        console.log('Notifications enabled successfully');
      } else {
        console.log('Failed to enable notifications');
        alert('Failed to enable notifications. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert(`Error enabling notifications: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    notificationPermissionService.disableNotifications();
    setSettings(notificationPermissionService.getSettings());
    updateSchedulerStatus();
  };

  const handleSettingsChange = (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    notificationPermissionService.updateSettings(updates);
    setSettings(newSettings);
  };

  const handleTestNotification = async () => {
    console.log('Test notification button clicked');
    console.log('Current settings:', settings);
    console.log('Permission status:', permissionStatus);
    console.log('Notifications enabled:', notificationPermissionService.areNotificationsEnabled());

    setIsLoading(true);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test notification timed out after 10 seconds')), 10000);
      });

      await Promise.race([
        notificationPermissionService.showTestNotification(),
        timeoutPromise
      ]);

      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert(`Error sending test notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCheck = async () => {
    setIsLoading(true);
    try {
      await notificationScheduler.forceExecute();
    } catch (error) {
      console.error('Error forcing notification check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return { text: 'Granted', color: 'text-green-400' };
      case 'denied':
        return { text: 'Denied', color: 'text-red-400' };
      default:
        return { text: 'Not requested', color: 'text-yellow-400' };
    }
  };

  const monitoringStats = notificationStorageService.getTodaysSummary();
  const statusInfo = getPermissionStatusText();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md mx-auto border border-slate-700 shadow-xl max-h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-blue-400" />
            <h2 id="notification-settings-title" className="text-xl font-semibold text-slate-100">{t('notificationSettings')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <div className="space-y-6">
          {/* Permission Status */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">{t('permissionStatus')}</h3>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {t(statusInfo.text)}
              </span>
              {!notificationPermissionService.isSupported() && (
                <span className="text-xs text-red-400">{t('notSupported')}</span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              <div>{t('supported')}: {notificationPermissionService.isSupported() ? t('yes') : t('no')}</div>
              <div>{t('enabled')}: {settings.enabled ? t('yes') : t('no')}</div>
              <div>{t('permission')}: {t(permissionStatus)}</div>
              <div>{t('canTest')}: {settings.enabled && permissionStatus === 'granted' ? t('yes') : t('no')}</div>
            </div>
          </div>

          {/* Enable/Disable Notifications */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">{t('dailyNotifications')}</h3>
              <label className="relative inline-flex items-center cursor-pointer" aria-label={t('toggleDailyNotifications')}>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleEnableNotifications();
                    } else {
                      handleDisableNotifications();
                    }
                  }}
                  className="sr-only"
                  disabled={isLoading}
                  aria-describedby="notification-toggle-description"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  settings.enabled ? 'bg-blue-600' : 'bg-slate-600'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </label>
            </div>
            <p className="text-xs text-slate-400" id="notification-toggle-description">
              {t('notificationDescription')}
            </p>
          </div>

          {/* Settings */}
          {settings.enabled && (
            <>
              {/* Low Balance Threshold */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">{t('lowBalanceThreshold')}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">৳</span>
                  <input
                    type="number"
                    value={settings.lowBalanceThreshold}
                    onChange={(e) => handleSettingsChange({ lowBalanceThreshold: Number(e.target.value) })}
                    className="flex-1 bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm"
                    min="0"
                    max="10000"
                    step="10"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {t('lowBalanceThresholdDescription')}
                </p>
              </div>

              {/* Notification Time */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">{t('notificationTime')}</h3>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={(e) => handleSettingsChange({ notificationTime: e.target.value })}
                  className="w-full bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {t('notificationTimeDescription')}
                </p>
              </div>

              {/* Scheduler Status */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">{t('schedulerStatus')}</h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <div>{t('status')}: <span className={schedulerStatus.isRunning ? 'text-green-400' : 'text-red-400'}>
                    {schedulerStatus.isRunning ? t('running') : t('stopped')}
                  </span></div>
                  {schedulerStatus.isRunning && (
                    <>
                      <div>{t('nextCheck')}: {schedulerStatus.nextScheduledTime}</div>
                      <div>{t('timeUntilNext')}: {schedulerStatus.timeUntilNext}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Today's Stats */}
              {monitoringStats && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">{t('todaysActivity')}</h3>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div>{t('notificationsSent')}: {monitoringStats.notifications.length}</div>
                    {monitoringStats.lastCheckTime && (
                      <div>{t('lastCheck')}: {new Date(monitoringStats.lastCheckTime).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {settings.enabled && permissionStatus === 'granted' && (
              <>
                <button
                  onClick={handleTestNotification}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Spinner size="sm" /> : t('testNotification')}
                </button>
                <button
                  onClick={handleForceCheck}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Spinner size="sm" /> : t('forceCheck')}
                </button>
              </>
            )}
          </div>

          {testNotificationSent && (
            <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
              <p className="text-sm text-green-400">{t('testNotificationSent')}</p>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">{t('notificationsBlocked')}</p>
                  <p className="text-xs text-red-300 mt-1">
                    {t('enableNotificationsInBrowser')}
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
