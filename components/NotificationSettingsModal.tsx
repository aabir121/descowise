import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './common/Modal';
import { CloseIcon, BellIcon, ExclamationTriangleIcon } from './common/Icons';
import { notificationPermissionService, NotificationPermissionStatus } from '../services/notificationPermissionService';
import { notificationScheduler } from '../services/notificationScheduler';
import { notificationStorageService } from '../services/notificationStorageService';
import Spinner from './common/Spinner';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    setIsLoading(true);
    try {
      const success = await notificationPermissionService.enableNotifications();
      if (success) {
        setSettings(notificationPermissionService.getSettings());
        updateSchedulerStatus();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
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
    setIsLoading(true);
    try {
      await notificationPermissionService.showTestNotification();
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-100">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Permission Status */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Permission Status</h3>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
              {!notificationPermissionService.isSupported() && (
                <span className="text-xs text-red-400">Not supported</span>
              )}
            </div>
          </div>

          {/* Enable/Disable Notifications */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Daily Notifications</h3>
              <label className="relative inline-flex items-center cursor-pointer">
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
            <p className="text-xs text-slate-400">
              Get notified daily at 3:00 PM BDT about low balances and data issues
            </p>
          </div>

          {/* Settings */}
          {settings.enabled && (
            <>
              {/* Low Balance Threshold */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Low Balance Threshold</h3>
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
                  Get notified when account balance falls below this amount
                </p>
              </div>

              {/* Notification Time */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Notification Time</h3>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={(e) => handleSettingsChange({ notificationTime: e.target.value })}
                  className="w-full bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Daily check time in Bangladesh timezone (BDT)
                </p>
              </div>

              {/* Scheduler Status */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Scheduler Status</h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <div>Status: <span className={schedulerStatus.isRunning ? 'text-green-400' : 'text-red-400'}>
                    {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                  </span></div>
                  {schedulerStatus.isRunning && (
                    <>
                      <div>Next check: {schedulerStatus.nextScheduledTime}</div>
                      <div>Time until next: {schedulerStatus.timeUntilNext}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Today's Stats */}
              {monitoringStats && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Today's Activity</h3>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div>Notifications sent: {monitoringStats.notifications.length}</div>
                    {monitoringStats.lastCheckTime && (
                      <div>Last check: {new Date(monitoringStats.lastCheckTime).toLocaleTimeString()}</div>
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
                  {isLoading ? <Spinner size="sm" /> : 'Test Notification'}
                </button>
                <button
                  onClick={handleForceCheck}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Spinner size="sm" /> : 'Force Check'}
                </button>
              </>
            )}
          </div>

          {testNotificationSent && (
            <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
              <p className="text-sm text-green-400">Test notification sent successfully!</p>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Notifications Blocked</p>
                  <p className="text-xs text-red-300 mt-1">
                    Please enable notifications in your browser settings to receive alerts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationSettingsModal;
