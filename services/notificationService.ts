/**
 * Main notification service that integrates all notification components
 */

import { Account } from '../types';
import { notificationPermissionService } from './notificationPermissionService';
import { notificationScheduler } from './notificationScheduler';
import { notificationStorageService } from './notificationStorageService';
import { accountMonitoringService } from './accountMonitoringService';
import { notificationErrorHandler } from './notificationErrorHandler';

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private accounts: Account[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification system
   */
  async initialize(accounts: Account[]): Promise<void> {
    if (this.isInitialized) {
      console.log('Notification system already initialized, updating accounts only');
      this.updateAccounts(accounts);
      return;
    }

    console.log('Initializing notification system...');

    this.accounts = accounts;

    // Initialize error handler
    notificationErrorHandler.initialize();

    // Register service worker message handlers
    this.registerServiceWorkerHandlers();

    // Start scheduler if notifications are enabled
    if (notificationPermissionService.areNotificationsEnabled()) {
      this.startScheduler();
    }

    this.isInitialized = true;
    console.log('Notification system initialized successfully');
  }

  /**
   * Update accounts list
   */
  updateAccounts(accounts: Account[]): void {
    this.accounts = accounts;
  }

  /**
   * Start the notification scheduler
   */
  startScheduler(): void {
    if (!notificationPermissionService.areNotificationsEnabled()) {
      console.log('Cannot start scheduler: notifications not enabled');
      return;
    }

    // Check if scheduler is already running to avoid duplicate logs
    const wasRunning = notificationScheduler.isRunning();

    notificationScheduler.start(async () => {
      await this.performScheduledCheck();
    });

    // Only log if scheduler wasn't already running
    if (!wasRunning) {
      console.log('Notification scheduler started');
    }
  }

  /**
   * Stop the notification scheduler
   */
  stopScheduler(): void {
    const wasRunning = notificationScheduler.isRunning();
    notificationScheduler.stop();

    // Only log if scheduler was actually running
    if (wasRunning) {
      console.log('Notification scheduler stopped');
    }
  }

  /**
   * Perform scheduled notification check
   */
  async performScheduledCheck(): Promise<void> {
    console.log('Performing scheduled notification check...');

    try {
      if (this.accounts.length === 0) {
        console.log('No accounts to check');
        return;
      }

      // Check if online
      if (!navigator.onLine) {
        console.log('Device is offline, skipping scheduled check');
        return;
      }

      // Check all accounts for alerts
      const result = await accountMonitoringService.checkAllAccounts(this.accounts);

      if (result.alerts.length > 0) {
        try {
          // Send notifications for alerts
          await accountMonitoringService.sendNotifications(result.alerts);
          console.log(`Sent ${result.alerts.length} notifications`);
        } catch (notificationError) {
          // Queue notifications for retry if sending fails
          result.alerts.forEach(alert => {
            notificationErrorHandler.queueNotification(
              alert.accountNo,
              alert.type,
              alert.message,
              alert
            );
          });
          notificationErrorHandler.handleError(notificationError, 'network');
        }
      } else {
        console.log('No alerts found during scheduled check');
      }

      if (result.errors.length > 0) {
        console.warn('Errors during scheduled check:', result.errors);
        result.errors.forEach(error => {
          notificationErrorHandler.handleError(error, 'api');
        });
      }

    } catch (error) {
      console.error('Error during scheduled notification check:', error);
      notificationErrorHandler.handleError(error, 'unknown');
    }
  }

  /**
   * Enable notifications and start scheduler
   */
  async enableNotifications(): Promise<boolean> {
    try {
      const success = await notificationPermissionService.enableNotifications();
      if (success) {
        this.startScheduler();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  /**
   * Disable notifications and stop scheduler
   */
  disableNotifications(): void {
    notificationPermissionService.disableNotifications();
    this.stopScheduler();
  }

  /**
   * Register service worker message handlers
   */
  private registerServiceWorkerHandlers(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    if (data.type === 'GET_ACCOUNTS') {
      // Send accounts to service worker
      event.ports[0].postMessage({ accounts: this.accounts });
    } else if (data.type === 'GET_NOTIFICATION_SETTINGS') {
      // Send notification settings to service worker
      const settings = notificationPermissionService.getSettings();
      event.ports[0].postMessage({ settings });
    } else if (data.type === 'WAS_DAILY_CHECK_PERFORMED') {
      // Check if daily check was performed
      const performed = notificationStorageService.wasDailyCheckPerformedToday();
      event.ports[0].postMessage({ performed });
    } else if (data.type === 'UPDATE_LAST_CHECK_TIME') {
      // Update last check time
      notificationStorageService.updateLastCheckTime();
    }
  }

  /**
   * Force a notification check (for testing)
   */
  async forceNotificationCheck(): Promise<void> {
    console.log('Forcing notification check...');
    await this.performScheduledCheck();
  }

  /**
   * Send a message to service worker
   */
  async sendMessageToServiceWorker(message: any): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage(message);
      }
    }
  }

  /**
   * Get notification system status
   */
  getStatus(): {
    isInitialized: boolean;
    notificationsEnabled: boolean;
    permissionStatus: string;
    schedulerRunning: boolean;
    accountCount: number;
    todayNotifications: number;
    nextScheduledTime?: string;
  } {
    return {
      isInitialized: this.isInitialized,
      notificationsEnabled: notificationPermissionService.areNotificationsEnabled(),
      permissionStatus: notificationPermissionService.getPermissionStatus(),
      schedulerRunning: notificationScheduler.isRunning(),
      accountCount: this.accounts.length,
      todayNotifications: notificationStorageService.getTodaysNotificationCount(),
      nextScheduledTime: notificationScheduler.isRunning() ? notificationScheduler.getNextScheduledTime() : undefined,
    };
  }

  /**
   * Clear all notification history
   */
  clearNotificationHistory(): void {
    notificationStorageService.clearHistory();
    console.log('Notification history cleared');
  }

  /**
   * Get notification history
   */
  getNotificationHistory(days: number = 7) {
    return notificationStorageService.getHistory(days);
  }

  /**
   * Check if browser supports notifications
   */
  isSupported(): boolean {
    return notificationPermissionService.isSupported();
  }

  /**
   * Show a test notification
   */
  async showTestNotification(): Promise<void> {
    await notificationPermissionService.showTestNotification();
  }

  /**
   * Update notification settings
   */
  updateSettings(updates: any): void {
    const wasRunning = notificationScheduler.isRunning();
    notificationPermissionService.updateSettings(updates);

    // Update scheduler configuration if needed
    if (updates.notificationTime) {
      notificationScheduler.updateConfig({
        targetTime: updates.notificationTime,
      });
    }

    // Only restart scheduler if it was running and settings actually changed
    if (wasRunning && (updates.notificationTime || updates.enabled !== undefined)) {
      console.log('Restarting scheduler due to settings change');
      this.startScheduler();
    }
  }

  /**
   * Get current notification settings
   */
  getSettings() {
    return notificationPermissionService.getSettings();
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
