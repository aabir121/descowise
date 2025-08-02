/**
 * Service for monitoring account balances and triggering notifications
 */

import { Account, BalanceResponse } from '../types';
import { getAccountBalance } from './descoService';
import { notificationPermissionService } from './notificationPermissionService';
import { notificationStorageService } from './notificationStorageService';

export interface AccountAlert {
  accountNo: string;
  accountName: string;
  type: 'low_balance' | 'data_unavailable';
  balance?: number | null;
  threshold?: number;
  message: string;
}

export interface MonitoringResult {
  totalAccounts: number;
  checkedAccounts: number;
  alerts: AccountAlert[];
  errors: string[];
  timestamp: string;
}

class AccountMonitoringService {
  private static instance: AccountMonitoringService;

  private constructor() {}

  static getInstance(): AccountMonitoringService {
    if (!AccountMonitoringService.instance) {
      AccountMonitoringService.instance = new AccountMonitoringService();
    }
    return AccountMonitoringService.instance;
  }

  /**
   * Check all accounts and identify those needing notifications
   */
  async checkAllAccounts(accounts: Account[]): Promise<MonitoringResult> {
    const settings = notificationPermissionService.getSettings();
    const result: MonitoringResult = {
      totalAccounts: accounts.length,
      checkedAccounts: 0,
      alerts: [],
      errors: [],
      timestamp: new Date().toISOString(),
    };

    if (!notificationPermissionService.areNotificationsEnabled()) {
      result.errors.push('Notifications are not enabled or permitted');
      return result;
    }

    console.log(`Starting account monitoring for ${accounts.length} accounts...`);

    // Check each account
    for (const account of accounts) {
      try {
        const alert = await this.checkSingleAccount(account, settings.lowBalanceThreshold);
        if (alert) {
          result.alerts.push(alert);
        }
        result.checkedAccounts++;
      } catch (error) {
        const errorMessage = `Failed to check account ${account.accountNo}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        console.error(errorMessage);
      }

      // Add small delay between requests to avoid overwhelming the API
      await this.delay(500);
    }

    console.log(`Account monitoring completed. Found ${result.alerts.length} alerts out of ${result.checkedAccounts} checked accounts.`);
    
    // Update last check time
    notificationStorageService.updateLastCheckTime();

    return result;
  }

  /**
   * Check a single account for notification conditions
   */
  private async checkSingleAccount(account: Account, threshold: number): Promise<AccountAlert | null> {
    try {
      const balanceResponse: BalanceResponse = await getAccountBalance(account.accountNo);
      const accountName = account.displayName || `Account ${account.accountNo}`;

      // Check for data unavailable condition
      if (!balanceResponse.success || balanceResponse.hasNullValues || balanceResponse.data?.balance === null || balanceResponse.data?.balance === undefined) {
        // Check if we already notified about data unavailability today
        if (!notificationStorageService.wasNotifiedToday(account.accountNo, 'data_unavailable')) {
          return {
            accountNo: account.accountNo,
            accountName,
            type: 'data_unavailable',
            balance: balanceResponse.data?.balance || null,
            message: `Account data is unavailable or shows as "N/A" for ${accountName}`,
          };
        }
        return null;
      }

      const balance = balanceResponse.data.balance;
      
      // Check for low balance condition
      if (typeof balance === 'number' && balance < threshold) {
        // Check if we already notified about low balance today
        if (!notificationStorageService.wasNotifiedToday(account.accountNo, 'low_balance')) {
          return {
            accountNo: account.accountNo,
            accountName,
            type: 'low_balance',
            balance,
            threshold,
            message: `Low balance alert: ${accountName} has ৳${balance.toFixed(2)} (below threshold of ৳${threshold})`,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error checking account ${account.accountNo}:`, error);
      throw error;
    }
  }

  /**
   * Send notifications for alerts
   */
  async sendNotifications(alerts: AccountAlert[]): Promise<void> {
    if (alerts.length === 0) {
      console.log('No alerts to send notifications for');
      return;
    }

    console.log(`Sending notifications for ${alerts.length} alerts...`);

    // Check if notifications are supported and permitted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      throw new Error('Notifications not supported or not permitted');
    }

    // Check if device is online
    if (!navigator.onLine) {
      throw new Error('Device is offline, cannot send notifications');
    }

    try {
      // Group alerts by type for better notification management
      const lowBalanceAlerts = alerts.filter(alert => alert.type === 'low_balance');
      const dataUnavailableAlerts = alerts.filter(alert => alert.type === 'data_unavailable');

      // Send notifications for low balance alerts
      if (lowBalanceAlerts.length > 0) {
        await this.sendLowBalanceNotifications(lowBalanceAlerts);
      }

      // Send notifications for data unavailable alerts
      if (dataUnavailableAlerts.length > 0) {
        await this.sendDataUnavailableNotifications(dataUnavailableAlerts);
      }

      // Record all notifications only after successful sending
      alerts.forEach(alert => {
        notificationStorageService.recordNotification(
          alert.accountNo,
          alert.type,
          alert.balance,
          alert.threshold
        );
      });

      console.log('All notifications sent successfully');
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  /**
   * Send low balance notifications
   */
  private async sendLowBalanceNotifications(alerts: AccountAlert[]): Promise<void> {
    if (alerts.length === 1) {
      // Single account notification
      const alert = alerts[0];
      await this.showNotification(
        'Low Balance Alert',
        alert.message,
        'low-balance'
      );
    } else {
      // Multiple accounts notification
      const accountNames = alerts.map(alert => alert.accountName).join(', ');
      await this.showNotification(
        'Low Balance Alert',
        `${alerts.length} accounts have low balance: ${accountNames}`,
        'low-balance-multiple'
      );
    }
  }

  /**
   * Send data unavailable notifications
   */
  private async sendDataUnavailableNotifications(alerts: AccountAlert[]): Promise<void> {
    if (alerts.length === 1) {
      // Single account notification
      const alert = alerts[0];
      await this.showNotification(
        'Account Data Unavailable',
        alert.message,
        'data-unavailable'
      );
    } else {
      // Multiple accounts notification
      const accountNames = alerts.map(alert => alert.accountName).join(', ');
      await this.showNotification(
        'Account Data Unavailable',
        `Data is unavailable for ${alerts.length} accounts: ${accountNames}`,
        'data-unavailable-multiple'
      );
    }
  }

  /**
   * Show a notification using service worker
   */
  private async showNotification(title: string, body: string, tag: string): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'View Accounts',
            icon: '/icon-192x192.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icon-192x192.png'
          }
        ],
        data: {
          timestamp: Date.now(),
          url: '/',
        }
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
      });
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    todayNotifications: number;
    accountsNotifiedToday: string[];
    lastCheckTime?: string;
  } {
    const todaySummary = notificationStorageService.getTodaysSummary();
    return {
      todayNotifications: notificationStorageService.getTodaysNotificationCount(),
      accountsNotifiedToday: notificationStorageService.getAccountsNotifiedToday(),
      lastCheckTime: todaySummary?.lastCheckTime,
    };
  }
}

// Export singleton instance
export const accountMonitoringService = AccountMonitoringService.getInstance();
