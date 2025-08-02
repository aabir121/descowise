/**
 * Service for managing notification history and preventing duplicate notifications
 */

export interface NotificationRecord {
  id: string;
  accountNo: string;
  type: 'low_balance' | 'data_unavailable';
  timestamp: string;
  balance?: number | null;
  threshold?: number;
  notified: boolean;
}

export interface DailyNotificationSummary {
  date: string; // YYYY-MM-DD format
  notifications: NotificationRecord[];
  lastCheckTime?: string;
}

class NotificationStorageService {
  private static instance: NotificationStorageService;
  private readonly STORAGE_KEY = 'desco_notification_history';
  private readonly MAX_HISTORY_DAYS = 30; // Keep 30 days of history

  private constructor() {}

  static getInstance(): NotificationStorageService {
    if (!NotificationStorageService.instance) {
      NotificationStorageService.instance = new NotificationStorageService();
    }
    return NotificationStorageService.instance;
  }

  /**
   * Get today's date in YYYY-MM-DD format (Bangladesh timezone)
   */
  private getTodayDateBDT(): string {
    const now = new Date();
    // Convert to Bangladesh timezone (UTC+6)
    const bdtOffset = 6 * 60; // 6 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdtTime = new Date(utc + (bdtOffset * 60000));
    return bdtTime.toISOString().split('T')[0];
  }

  /**
   * Get current timestamp in Bangladesh timezone
   */
  private getCurrentTimestampBDT(): string {
    const now = new Date();
    const bdtOffset = 6 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdtTime = new Date(utc + (bdtOffset * 60000));
    return bdtTime.toISOString();
  }

  /**
   * Load notification history from localStorage
   */
  private loadHistory(): Record<string, DailyNotificationSummary> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        // Clean up old entries
        return this.cleanupOldEntries(history);
      }
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
    return {};
  }

  /**
   * Save notification history to localStorage
   */
  private saveHistory(history: Record<string, DailyNotificationSummary>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }

  /**
   * Clean up old notification entries
   */
  private cleanupOldEntries(history: Record<string, DailyNotificationSummary>): Record<string, DailyNotificationSummary> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_HISTORY_DAYS);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const cleaned: Record<string, DailyNotificationSummary> = {};
    Object.entries(history).forEach(([date, summary]) => {
      if (date >= cutoffDateStr) {
        cleaned[date] = summary;
      }
    });

    return cleaned;
  }

  /**
   * Check if an account was already notified today for a specific condition
   */
  wasNotifiedToday(accountNo: string, type: 'low_balance' | 'data_unavailable'): boolean {
    const today = this.getTodayDateBDT();
    const history = this.loadHistory();
    const todaySummary = history[today];

    if (!todaySummary) {
      return false;
    }

    return todaySummary.notifications.some(
      record => record.accountNo === accountNo && record.type === type && record.notified
    );
  }

  /**
   * Record a notification for an account
   */
  recordNotification(
    accountNo: string,
    type: 'low_balance' | 'data_unavailable',
    balance?: number | null,
    threshold?: number
  ): string {
    const today = this.getTodayDateBDT();
    const history = this.loadHistory();
    
    if (!history[today]) {
      history[today] = {
        date: today,
        notifications: [],
      };
    }

    const notificationId = `${accountNo}_${type}_${Date.now()}`;
    const record: NotificationRecord = {
      id: notificationId,
      accountNo,
      type,
      timestamp: this.getCurrentTimestampBDT(),
      balance,
      threshold,
      notified: true,
    };

    history[today].notifications.push(record);
    history[today].lastCheckTime = this.getCurrentTimestampBDT();
    
    this.saveHistory(history);
    return notificationId;
  }

  /**
   * Update the last check time for today
   */
  updateLastCheckTime(): void {
    const today = this.getTodayDateBDT();
    const history = this.loadHistory();
    
    if (!history[today]) {
      history[today] = {
        date: today,
        notifications: [],
      };
    }

    history[today].lastCheckTime = this.getCurrentTimestampBDT();
    this.saveHistory(history);
  }

  /**
   * Get today's notification summary
   */
  getTodaysSummary(): DailyNotificationSummary | null {
    const today = this.getTodayDateBDT();
    const history = this.loadHistory();
    return history[today] || null;
  }

  /**
   * Get notification history for a specific number of days
   */
  getHistory(days: number = 7): DailyNotificationSummary[] {
    const history = this.loadHistory();
    const result: DailyNotificationSummary[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (history[dateStr]) {
        result.push(history[dateStr]);
      }
    }

    return result.reverse(); // Return in chronological order
  }

  /**
   * Get notification count for today
   */
  getTodaysNotificationCount(): number {
    const todaySummary = this.getTodaysSummary();
    return todaySummary ? todaySummary.notifications.length : 0;
  }

  /**
   * Clear all notification history
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }

  /**
   * Get accounts that were notified today
   */
  getAccountsNotifiedToday(): string[] {
    const todaySummary = this.getTodaysSummary();
    if (!todaySummary) {
      return [];
    }

    const accountsSet = new Set<string>();
    todaySummary.notifications.forEach(record => {
      if (record.notified) {
        accountsSet.add(record.accountNo);
      }
    });

    return Array.from(accountsSet);
  }

  /**
   * Check if daily check was already performed today
   */
  wasDailyCheckPerformedToday(): boolean {
    const todaySummary = this.getTodaysSummary();
    if (!todaySummary || !todaySummary.lastCheckTime) {
      return false;
    }

    // Check if the last check was performed today
    const lastCheckDate = new Date(todaySummary.lastCheckTime).toISOString().split('T')[0];
    const today = this.getTodayDateBDT();
    
    return lastCheckDate === today;
  }
}

// Export singleton instance
export const notificationStorageService = NotificationStorageService.getInstance();
