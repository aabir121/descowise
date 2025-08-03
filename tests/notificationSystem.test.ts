/**
 * Basic tests for the notification system
 * Run these tests to verify the notification system is working correctly
 */

import { notificationPermissionService } from '../services/notificationPermissionService';
import { notificationStorageService } from '../services/notificationStorageService';
import { notificationScheduler } from '../services/notificationScheduler';
import { accountMonitoringService } from '../services/accountMonitoringService';
import { notificationService } from '../services/notificationService';
import { notificationErrorHandler } from '../services/notificationErrorHandler';

// Mock data for testing
const mockAccounts = [
  {
    accountNo: '12345',
    customerName: 'Test User 1',
    contactNo: '01234567890',
    feederName: 'Test Feeder',
    installationAddress: 'Test Address',
    meterNo: 'M12345',
    tariffSolution: 'Residential',
    sanctionLoad: '5 KW',
    displayName: 'Test Account 1',
    dateAdded: new Date().toISOString(),
    aiInsightsEnabled: false,
    banglaEnabled: false,
  },
  {
    accountNo: '67890',
    customerName: 'Test User 2',
    contactNo: '01987654321',
    feederName: 'Test Feeder 2',
    installationAddress: 'Test Address 2',
    meterNo: 'M67890',
    tariffSolution: 'Commercial',
    sanctionLoad: '10 KW',
    displayName: 'Test Account 2',
    dateAdded: new Date().toISOString(),
    aiInsightsEnabled: false,
    banglaEnabled: false,
  }
];

/**
 * Test notification permission service
 */
export function testNotificationPermissions(): void {
  console.log('🧪 Testing Notification Permissions...');
  
  const isSupported = notificationPermissionService.isSupported();
  console.log(`✓ Browser support: ${isSupported ? 'Supported' : 'Not supported'}`);
  
  const status = notificationPermissionService.getPermissionStatus();
  console.log(`✓ Permission status: ${status}`);
  
  const settings = notificationPermissionService.getSettings();
  console.log(`✓ Settings loaded:`, settings);
  
  console.log('✅ Notification permissions test completed\n');
}

/**
 * Test notification storage service
 */
export function testNotificationStorage(): void {
  console.log('🧪 Testing Notification Storage...');
  
  // Clear any existing data
  notificationStorageService.clearHistory();
  
  // Test recording notifications
  const notificationId = notificationStorageService.recordNotification(
    '12345',
    'low_balance',
    50,
    100
  );
  console.log(`✓ Recorded notification: ${notificationId}`);
  
  // Test checking if notified today
  const wasNotified = notificationStorageService.wasNotifiedToday('12345', 'low_balance');
  console.log(`✓ Was notified today: ${wasNotified}`);
  
  // Test getting today's summary
  const summary = notificationStorageService.getTodaysSummary();
  console.log(`✓ Today's summary:`, summary);
  
  console.log('✅ Notification storage test completed\n');
}

/**
 * Test notification scheduler
 */
export function testNotificationScheduler(): void {
  console.log('🧪 Testing Notification Scheduler...');
  
  const config = notificationScheduler.getConfig();
  console.log(`✓ Scheduler config:`, config);
  
  const nextTime = notificationScheduler.getNextScheduledTime();
  console.log(`✓ Next scheduled time: ${nextTime}`);
  
  const timeUntilNext = notificationScheduler.getTimeUntilNext();
  console.log(`✓ Time until next: ${timeUntilNext}`);
  
  const currentBDT = notificationScheduler.getCurrentBDTString();
  console.log(`✓ Current BDT time: ${currentBDT}`);
  
  console.log('✅ Notification scheduler test completed\n');
}

/**
 * Test error handler
 */
export function testErrorHandler(): void {
  console.log('🧪 Testing Error Handler...');
  
  // Clear existing errors
  notificationErrorHandler.clearAll();
  
  // Test error handling
  const errorId = notificationErrorHandler.handleError(
    'Test error message',
    'network',
    '12345'
  );
  console.log(`✓ Error recorded: ${errorId}`);
  
  // Test notification queuing
  const queueId = notificationErrorHandler.queueNotification(
    '12345',
    'low_balance',
    'Test queued notification'
  );
  console.log(`✓ Notification queued: ${queueId}`);
  
  // Test queue status
  const queueStatus = notificationErrorHandler.getQueueStatus();
  console.log(`✓ Queue status:`, queueStatus);
  
  // Test recent errors
  const recentErrors = notificationErrorHandler.getRecentErrors(5);
  console.log(`✓ Recent errors:`, recentErrors);
  
  console.log('✅ Error handler test completed\n');
}

/**
 * Test notification service integration
 */
export async function testNotificationService(): Promise<void> {
  console.log('🧪 Testing Notification Service Integration...');
  
  try {
    // Initialize the service
    await notificationService.initialize(mockAccounts);
    console.log('✓ Notification service initialized');
    
    // Get status
    const status = notificationService.getStatus();
    console.log('✓ Service status:', status);
    
    // Test settings
    const settings = notificationService.getSettings();
    console.log('✓ Service settings:', settings);
    
    // Test if supported
    const isSupported = notificationService.isSupported();
    console.log(`✓ Service supported: ${isSupported}`);
    
    console.log('✅ Notification service integration test completed\n');
  } catch (error) {
    console.error('❌ Notification service test failed:', error);
  }
}

/**
 * Test notification system with mock data
 */
export async function testNotificationSystemWithMockData(): Promise<void> {
  console.log('🧪 Testing Notification System with Mock Data...');
  
  try {
    // Test account monitoring with mock data
    const mockAccountsWithBalance = mockAccounts.map(account => ({
      ...account,
      balance: Math.random() > 0.5 ? 50 : 150, // Random balance for testing
    }));
    
    console.log('✓ Mock accounts prepared:', mockAccountsWithBalance.length);
    
    // Note: We can't actually test the full monitoring without real API calls
    // But we can test the structure and error handling
    
    const monitoringStats = accountMonitoringService.getMonitoringStats();
    console.log('✓ Monitoring stats:', monitoringStats);
    
    console.log('✅ Mock data test completed\n');
  } catch (error) {
    console.error('❌ Mock data test failed:', error);
  }
}

/**
 * Run all tests
 */
export async function runAllNotificationTests(): Promise<void> {
  console.log('🚀 Starting Notification System Tests...\n');
  
  testNotificationPermissions();
  testNotificationStorage();
  testNotificationScheduler();
  testErrorHandler();
  await testNotificationService();
  await testNotificationSystemWithMockData();
  
  console.log('🎉 All notification system tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Enable notifications in the UI');
  console.log('2. Add some accounts to monitor');
  console.log('3. Wait for 3:00 PM BDT or use the "Force Check" button');
  console.log('4. Check browser notifications');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).notificationTests = {
    runAll: runAllNotificationTests,
    testPermissions: testNotificationPermissions,
    testStorage: testNotificationStorage,
    testScheduler: testNotificationScheduler,
    testErrorHandler: testErrorHandler,
    testService: testNotificationService,
    testMockData: testNotificationSystemWithMockData,
  };
  

}
