# Push Notification System Documentation

## Overview

The DESCO Account Manager now includes a comprehensive push notification system that monitors account balances and data availability, sending daily notifications at 3:00 PM Bangladesh Time (BDT).

## Features

### ✅ Notification Triggers
- **Low Balance Alert**: Triggered when account balance falls below the configured threshold (default: ৳100)
- **Data Unavailable Alert**: Triggered when account data shows as "N/A" or is unavailable

### ✅ Scheduling
- **Daily Check**: Automatically checks all accounts once per day at 3:00 PM BDT
- **Bangladesh Timezone**: All scheduling is based on Bangladesh Standard Time (UTC+6)
- **Duplicate Prevention**: Ensures notifications are sent only once per day per qualifying account

### ✅ Browser Support
- **Service Workers**: Uses service workers for background processing
- **Push Notifications**: Implements browser push notification API
- **Cross-Browser**: Works on Chrome, Firefox, Safari, and Edge (where supported)

### ✅ Error Handling & Offline Support
- **Offline Queuing**: Queues notifications when device is offline
- **Retry Logic**: Automatically retries failed notifications
- **Error Logging**: Comprehensive error tracking and logging

## Components

### Core Services

1. **NotificationPermissionService** (`services/notificationPermissionService.ts`)
   - Manages browser notification permissions
   - Handles notification settings storage
   - Provides permission status tracking

2. **NotificationStorageService** (`services/notificationStorageService.ts`)
   - Tracks notification history
   - Prevents duplicate notifications
   - Manages daily check status

3. **NotificationScheduler** (`services/notificationScheduler.ts`)
   - Handles daily scheduling at 3:00 PM BDT
   - Manages timezone calculations
   - Provides scheduling status information

4. **AccountMonitoringService** (`services/accountMonitoringService.ts`)
   - Monitors account balances and data availability
   - Identifies accounts needing notifications
   - Sends notifications through service worker

5. **NotificationService** (`services/notificationService.ts`)
   - Main integration service
   - Coordinates all notification components
   - Handles service worker communication

6. **NotificationErrorHandler** (`services/notificationErrorHandler.ts`)
   - Manages error handling and retry logic
   - Implements offline notification queuing
   - Provides error tracking and debugging

### UI Components

1. **NotificationSettingsModal** (`components/NotificationSettingsModal.tsx`)
   - User interface for notification settings
   - Permission management
   - Test notification functionality
   - Scheduler status display

### Service Worker Integration

The existing service worker (`public/sw.js`) has been enhanced with:
- Background notification checking
- Message handling for account data
- Notification display and click handling
- Offline support and queuing

## Usage

### 1. Enable Notifications

Click the "Notifications" button in the header to open the settings modal:

1. Toggle "Daily Notifications" to enable
2. Grant browser permission when prompted
3. Configure low balance threshold (default: ৳100)
4. Set notification time (default: 15:00 BDT)

### 2. Test the System

Use the built-in testing features:

1. **Test Notification**: Send a test notification to verify setup
2. **Force Check**: Manually trigger account monitoring
3. **Browser Console**: Run `window.notificationTests.runAll()` for comprehensive testing

### 3. Monitor Status

The notification settings modal shows:
- Permission status
- Scheduler status
- Next scheduled check time
- Today's notification activity

## Configuration

### Default Settings

```typescript
{
  enabled: false,
  lowBalanceThreshold: 100,
  notificationTime: '15:00', // 3:00 PM BDT
}
```

### Customization

Users can customize:
- **Low Balance Threshold**: Any amount in Taka (৳)
- **Notification Time**: Any time in 24-hour format (BDT)
- **Enable/Disable**: Toggle notifications on/off

## Technical Details

### Bangladesh Timezone Handling

The system correctly handles Bangladesh Standard Time (UTC+6):

```typescript
// Convert to Bangladesh timezone
const bdtOffset = 6 * 60; // 6 hours in minutes
const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
const bdtTime = new Date(utc + (bdtOffset * 60000));
```

### Notification Conditions

1. **Low Balance**: `balance < threshold && typeof balance === 'number'`
2. **Data Unavailable**: `balance === null || balance === undefined || !response.success`

### Storage

- **Settings**: Stored in localStorage as `notificationSettings`
- **History**: Stored in localStorage as `desco_notification_history`
- **Errors**: Stored in localStorage as `desco_notification_errors`
- **Queue**: Stored in localStorage as `desco_notification_queue`

### Service Worker Communication

The main thread communicates with the service worker using message channels:

```typescript
// Get accounts from main thread
clients[0].postMessage({ type: 'GET_ACCOUNTS' }, [messageChannel.port2]);

// Update last check time
clients[0].postMessage({ type: 'UPDATE_LAST_CHECK_TIME' });
```

## Testing

### Manual Testing

1. **Enable Notifications**: Use the settings modal
2. **Test Notification**: Click "Test Notification" button
3. **Force Check**: Click "Force Check" button
4. **Mock Low Balance**: Temporarily modify threshold to trigger alerts

### Automated Testing

Run the test suite in browser console:

```javascript
// Run all tests
window.notificationTests.runAll();

// Run individual tests
window.notificationTests.testPermissions();
window.notificationTests.testStorage();
window.notificationTests.testScheduler();
```

## Troubleshooting

### Common Issues

1. **Notifications Not Working**
   - Check browser permissions
   - Verify service worker registration
   - Check console for errors

2. **Scheduling Issues**
   - Verify system timezone
   - Check scheduler status in settings
   - Ensure browser tab remains open

3. **Offline Issues**
   - Check network connectivity
   - Verify queued notifications in console
   - Check error handler logs

### Debug Information

Access debug information through:

```javascript
// Service status
notificationService.getStatus();

// Error logs
notificationErrorHandler.getRecentErrors();

// Queue status
notificationErrorHandler.getQueueStatus();

// Storage summary
notificationStorageService.getTodaysSummary();
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 50+ | ✅ Full | Best support |
| Firefox 44+ | ✅ Full | Good support |
| Safari 16+ | ✅ Limited | iOS requires user interaction |
| Edge 79+ | ✅ Full | Chromium-based |

## Security & Privacy

- **Local Storage**: All data stored locally in browser
- **No External Services**: No third-party notification services
- **User Control**: Users can disable notifications anytime
- **Data Retention**: Notification history limited to 30 days

## Future Enhancements

Potential improvements:
- Push server integration for background notifications
- Custom notification sounds
- Rich notification content
- Multiple notification times
- Account-specific thresholds
