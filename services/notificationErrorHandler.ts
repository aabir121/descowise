/**
 * Error handling and offline support for notification system
 */

export interface NotificationError {
  id: string;
  type: 'network' | 'permission' | 'api' | 'unknown';
  message: string;
  timestamp: string;
  accountNo?: string;
  retryCount: number;
  maxRetries: number;
}

export interface QueuedNotification {
  id: string;
  accountNo: string;
  type: 'low_balance' | 'data_unavailable';
  message: string;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  data?: any;
}

class NotificationErrorHandler {
  private static instance: NotificationErrorHandler;
  private readonly ERROR_STORAGE_KEY = 'desco_notification_errors';
  private readonly QUEUE_STORAGE_KEY = 'desco_notification_queue';
  private readonly MAX_ERRORS = 50;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly DEFAULT_MAX_RETRIES = 3;

  private constructor() {}

  static getInstance(): NotificationErrorHandler {
    if (!NotificationErrorHandler.instance) {
      NotificationErrorHandler.instance = new NotificationErrorHandler();
    }
    return NotificationErrorHandler.instance;
  }

  /**
   * Handle and log notification errors
   */
  handleError(
    error: Error | string,
    type: NotificationError['type'] = 'unknown',
    accountNo?: string,
    context?: any
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorMessage = error instanceof Error ? error.message : error;

    const notificationError: NotificationError = {
      id: errorId,
      type,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      accountNo,
      retryCount: 0,
      maxRetries: this.DEFAULT_MAX_RETRIES,
    };

    this.storeError(notificationError);
    
    console.error(`Notification Error [${type}]:`, {
      id: errorId,
      message: errorMessage,
      accountNo,
      context,
    });

    return errorId;
  }

  /**
   * Queue notification for retry when back online
   */
  queueNotification(
    accountNo: string,
    type: 'low_balance' | 'data_unavailable',
    message: string,
    data?: any
  ): string {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queuedNotification: QueuedNotification = {
      id: queueId,
      accountNo,
      type,
      message,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.DEFAULT_MAX_RETRIES,
      data,
    };

    this.storeQueuedNotification(queuedNotification);
    console.log(`Notification queued for retry: ${queueId}`);

    return queueId;
  }

  /**
   * Process queued notifications when back online
   */
  async processQueue(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Still offline, skipping queue processing');
      return;
    }

    const queue = this.getQueuedNotifications();
    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} queued notifications...`);

    for (const notification of queue) {
      try {
        await this.retryNotification(notification);
        this.removeFromQueue(notification.id);
      } catch (error) {
        notification.retryCount++;
        
        if (notification.retryCount >= notification.maxRetries) {
          console.error(`Max retries reached for notification ${notification.id}, removing from queue`);
          this.removeFromQueue(notification.id);
          this.handleError(
            `Failed to send notification after ${notification.maxRetries} retries`,
            'network',
            notification.accountNo
          );
        } else {
          console.log(`Retry ${notification.retryCount}/${notification.maxRetries} failed for ${notification.id}`);
          this.updateQueuedNotification(notification);
        }
      }

      // Add delay between retries
      await this.delay(1000);
    }
  }

  /**
   * Retry a queued notification
   */
  private async retryNotification(notification: QueuedNotification): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      const title = notification.type === 'low_balance' ? 'Low Balance Alert' : 'Account Data Unavailable';
      
      await registration.showNotification(title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: `${notification.type}-${notification.accountNo}`,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Accounts' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: {
          timestamp: Date.now(),
          originalTimestamp: notification.timestamp,
          retryCount: notification.retryCount,
        }
      });
    } else {
      throw new Error('Service worker not available for notification retry');
    }
  }

  /**
   * Check if device is online and process queue if needed
   */
  handleOnlineStatusChange(): void {
    if (navigator.onLine) {
      console.log('Device back online, processing notification queue...');
      this.processQueue().catch(error => {
        this.handleError(error, 'network');
      });
    } else {
      console.log('Device went offline, notifications will be queued');
    }
  }

  /**
   * Store error in localStorage
   */
  private storeError(error: NotificationError): void {
    try {
      const errors = this.getStoredErrors();
      errors.unshift(error);
      
      // Keep only the most recent errors
      if (errors.length > this.MAX_ERRORS) {
        errors.splice(this.MAX_ERRORS);
      }
      
      localStorage.setItem(this.ERROR_STORAGE_KEY, JSON.stringify(errors));
    } catch (storageError) {
      console.error('Failed to store notification error:', storageError);
    }
  }

  /**
   * Store queued notification in localStorage
   */
  private storeQueuedNotification(notification: QueuedNotification): void {
    try {
      const queue = this.getQueuedNotifications();
      queue.push(notification);
      
      // Keep queue size manageable
      if (queue.length > this.MAX_QUEUE_SIZE) {
        queue.splice(0, queue.length - this.MAX_QUEUE_SIZE);
      }
      
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (storageError) {
      console.error('Failed to store queued notification:', storageError);
    }
  }

  /**
   * Get stored errors
   */
  private getStoredErrors(): NotificationError[] {
    try {
      const stored = localStorage.getItem(this.ERROR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load stored errors:', error);
      return [];
    }
  }

  /**
   * Get queued notifications
   */
  private getQueuedNotifications(): QueuedNotification[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load queued notifications:', error);
      return [];
    }
  }

  /**
   * Update queued notification
   */
  private updateQueuedNotification(notification: QueuedNotification): void {
    try {
      const queue = this.getQueuedNotifications();
      const index = queue.findIndex(n => n.id === notification.id);
      if (index !== -1) {
        queue[index] = notification;
        localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to update queued notification:', error);
    }
  }

  /**
   * Remove notification from queue
   */
  private removeFromQueue(notificationId: string): void {
    try {
      const queue = this.getQueuedNotifications();
      const filtered = queue.filter(n => n.id !== notificationId);
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove notification from queue:', error);
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): NotificationError[] {
    return this.getStoredErrors().slice(0, limit);
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueSize: number;
    oldestTimestamp?: string;
    newestTimestamp?: string;
  } {
    const queue = this.getQueuedNotifications();
    return {
      queueSize: queue.length,
      oldestTimestamp: queue.length > 0 ? queue[0].timestamp : undefined,
      newestTimestamp: queue.length > 0 ? queue[queue.length - 1].timestamp : undefined,
    };
  }

  /**
   * Clear all errors and queue
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.ERROR_STORAGE_KEY);
      localStorage.removeItem(this.QUEUE_STORAGE_KEY);
      console.log('Notification errors and queue cleared');
    } catch (error) {
      console.error('Failed to clear notification data:', error);
    }
  }

  /**
   * Initialize error handler with online/offline listeners
   */
  initialize(): void {
    window.addEventListener('online', () => this.handleOnlineStatusChange());
    window.addEventListener('offline', () => this.handleOnlineStatusChange());
    
    // Process any existing queue on initialization
    if (navigator.onLine) {
      this.processQueue().catch(error => {
        this.handleError(error, 'network');
      });
    }
    
    console.log('Notification error handler initialized');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const notificationErrorHandler = NotificationErrorHandler.getInstance();
