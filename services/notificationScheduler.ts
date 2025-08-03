/**
 * Service for scheduling daily notifications at specific times in Bangladesh timezone
 */

import { notificationStorageService } from './notificationStorageService';

export interface SchedulerConfig {
  targetTime: string; // HH:MM format
  timezone: string;
  enabled: boolean;
}

class NotificationScheduler {
  private static instance: NotificationScheduler;
  private intervalId: number | null = null;
  private config: SchedulerConfig;
  private onScheduledCheck?: () => Promise<void>;

  private constructor() {
    this.config = {
      targetTime: '15:00', // 3:00 PM
      timezone: 'Asia/Dhaka', // Bangladesh timezone
      enabled: false,
    };
  }

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Get current time in Bangladesh timezone
   */
  private getBangladeshTime(): Date {
    const now = new Date();
    // Bangladesh is UTC+6
    const bdtOffset = 6 * 60; // 6 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdtTime = new Date(utc + (bdtOffset * 60000));
    return bdtTime;
  }

  /**
   * Parse time string (HH:MM) into hours and minutes
   */
  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Check if current time matches the target time
   */
  private isTargetTime(): boolean {
    const now = this.getBangladeshTime();
    const target = this.parseTime(this.config.targetTime);
    
    return now.getHours() === target.hours && now.getMinutes() === target.minutes;
  }

  /**
   * Calculate milliseconds until next target time
   */
  private getMillisecondsUntilTarget(): number {
    const now = this.getBangladeshTime();
    const target = this.parseTime(this.config.targetTime);
    
    const targetTime = new Date(now);
    targetTime.setHours(target.hours, target.minutes, 0, 0);
    
    // If target time has passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime.getTime() - now.getTime();
  }

  /**
   * Get next scheduled time as a readable string
   */
  getNextScheduledTime(): string {
    const msUntilTarget = this.getMillisecondsUntilTarget();
    const nextTime = new Date(Date.now() + msUntilTarget);
    const bdtTime = this.getBangladeshTime();
    bdtTime.setTime(nextTime.getTime());
    
    return bdtTime.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' BDT';
  }

  /**
   * Start the scheduler
   */
  start(onScheduledCheck: () => Promise<void>): void {
    // If already running with the same callback, don't restart
    if (this.intervalId && this.onScheduledCheck === onScheduledCheck) {
      console.log('Notification scheduler already running, skipping restart');
      return;
    }

    if (this.intervalId) {
      console.log('Stopping existing scheduler to restart with new configuration');
      this.stop();
    }

    this.onScheduledCheck = onScheduledCheck;
    this.config.enabled = true;

    // Check every minute
    this.intervalId = window.setInterval(() => {
      this.checkAndExecute();
    }, 60000); // 60 seconds

    console.log(`Notification scheduler started. Next check: ${this.getNextScheduledTime()}`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.config.enabled = false;
      console.log('Notification scheduler stopped');
    } else {
      // Already stopped, don't log
      this.config.enabled = false;
    }
  }

  /**
   * Check if it's time to execute and run the callback
   */
  private async checkAndExecute(): Promise<void> {
    if (!this.config.enabled || !this.onScheduledCheck) {
      return;
    }

    // Check if it's the target time
    if (!this.isTargetTime()) {
      return;
    }

    // Check if we already performed the daily check today
    if (notificationStorageService.wasDailyCheckPerformedToday()) {
      console.log('Daily notification check already performed today, skipping...');
      return;
    }

    console.log('Executing scheduled notification check at', this.getBangladeshTime().toISOString());

    try {
      await this.onScheduledCheck();
      console.log('Scheduled notification check completed successfully');
    } catch (error) {
      console.error('Error during scheduled notification check:', error);
    }
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(updates: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart scheduler if it was running
    if (this.intervalId && this.onScheduledCheck) {
      this.start(this.onScheduledCheck);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.intervalId !== null && this.config.enabled;
  }

  /**
   * Force execute the scheduled check (for testing)
   */
  async forceExecute(): Promise<void> {
    if (!this.onScheduledCheck) {
      throw new Error('No scheduled check callback registered');
    }

    console.log('Force executing notification check...');
    try {
      await this.onScheduledCheck();
      console.log('Force execution completed successfully');
    } catch (error) {
      console.error('Error during force execution:', error);
      throw error;
    }
  }

  /**
   * Get time until next scheduled check
   */
  getTimeUntilNext(): string {
    if (!this.config.enabled) {
      return 'Scheduler is disabled';
    }

    const msUntilTarget = this.getMillisecondsUntilTarget();
    const hours = Math.floor(msUntilTarget / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilTarget % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get current Bangladesh time as string
   */
  getCurrentBDTString(): string {
    const bdtTime = this.getBangladeshTime();
    return bdtTime.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' BDT';
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
