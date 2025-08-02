/**
 * Service for managing browser notification permissions and status
 */

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

export interface NotificationSettings {
  enabled: boolean;
  lowBalanceThreshold: number;
  notificationTime: string; // HH:MM format in BDT
  lastNotificationDate?: string;
}

class NotificationPermissionService {
  private static instance: NotificationPermissionService;
  private listeners: ((status: NotificationPermissionStatus) => void)[] = [];
  private settings: NotificationSettings;

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): NotificationPermissionService {
    if (!NotificationPermissionService.instance) {
      NotificationPermissionService.instance = new NotificationPermissionService();
    }
    return NotificationPermissionService.instance;
  }

  /**
   * Check if notifications are supported by the browser
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.getPermissionStatus() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.notifyListeners(permission as NotificationPermissionStatus);
      return permission as NotificationPermissionStatus;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  /**
   * Subscribe to permission status changes
   */
  subscribe(listener: (status: NotificationPermissionStatus) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.getPermissionStatus());
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Load notification settings from localStorage
   */
  private loadSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem('notificationSettings');
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    return this.getDefaultSettings();
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: false,
      lowBalanceThreshold: 100,
      notificationTime: '15:00', // 3:00 PM BDT
    };
  }

  /**
   * Save notification settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Get current notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  updateSettings(updates: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  /**
   * Enable notifications (requests permission if needed)
   */
  async enableNotifications(): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        this.updateSettings({ enabled: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  /**
   * Disable notifications
   */
  disableNotifications(): void {
    this.updateSettings({ enabled: false });
  }

  /**
   * Check if notifications are enabled and permitted
   */
  areNotificationsEnabled(): boolean {
    return this.settings.enabled && this.getPermissionStatus() === 'granted';
  }

  /**
   * Notify all listeners of permission status change
   */
  private notifyListeners(status: NotificationPermissionStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Show a test notification
   */
  async showTestNotification(): Promise<void> {
    if (!this.areNotificationsEnabled()) {
      throw new Error('Notifications are not enabled or permitted');
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('DESCO Account Manager', {
        body: 'Test notification - your notification system is working!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false,
      });
    } else {
      // Fallback to regular notification
      new Notification('DESCO Account Manager', {
        body: 'Test notification - your notification system is working!',
        icon: '/icon-192x192.png',
      });
    }
  }
}

// Export singleton instance
export const notificationPermissionService = NotificationPermissionService.getInstance();
