# DescoWise User Guide

## Welcome to DescoWise

DescoWise is a modern web application that enhances your DESCO (Dhaka Electric Supply Company Limited) account management experience with AI-powered insights, advanced analytics, and smart notifications.

## Getting Started

### First-Time Setup

1. **Open DescoWise** in your web browser
2. **Complete Onboarding**: Choose your preferred language (English or Bangla)
3. **Add Your First Account**: Enter a valid DESCO account number
4. **Configure AI Features** (optional): Add your Gemini API key for AI insights
5. **Set Up Notifications** (optional): Enable daily balance monitoring

### System Requirements

- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **Internet Connection**: Required for real-time data
- **JavaScript Enabled**: Required for full functionality

## Core Features

### 1. Account Management

#### Adding an Account

1. Click the **"Add Account"** button on the main page
2. Enter your **DESCO account number** (digits only)
3. The system will **verify the account** automatically
4. **Customize the display name** if desired
5. Click **"Add Account"** to save

#### Managing Multiple Accounts

- **View All Accounts**: See all your accounts on the main dashboard
- **Custom Names**: Set personalized names for easy identification
- **Quick Access**: Click any account card to view detailed dashboard
- **Account Sharing**: Generate secure links to share specific accounts

#### Account Settings

- **Display Name**: Customize how accounts appear in your dashboard
- **AI Insights**: Enable/disable AI analysis per account
- **Language**: Choose Bangla or English for account-specific content
- **Delete Account**: Remove accounts you no longer need

### 2. Dashboard Analytics

#### Balance Information

- **Current Balance**: Real-time balance display with last update time
- **Balance Trend**: Visual representation of balance changes over time
- **Low Balance Alerts**: Automatic warnings when balance is low
- **Recharge Recommendations**: AI-powered suggestions for optimal recharge amounts

#### Consumption Analytics

- **Daily Consumption**: Track daily electricity usage patterns
- **Monthly Trends**: Analyze consumption patterns over months
- **Consumption Forecasting**: Predict future usage based on historical data
- **Peak Usage Detection**: Identify high-consumption periods

#### Interactive Charts

- **Zoom and Pan**: Explore data in detail with interactive controls
- **Multiple Views**: Switch between different chart types and time periods
- **Mobile Optimized**: Touch-friendly charts for mobile devices
- **Export Options**: Save chart data for external analysis

### 3. AI-Powered Insights

#### Setting Up AI Features

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key (starts with "AIza...")

2. **Configure in DescoWise**:
   - Click the **API Key Status** button in the header
   - Paste your API key
   - Click **"Validate and Save"**

#### AI Analysis Features

- **Consumption Pattern Analysis**: Understand your electricity usage habits
- **Anomaly Detection**: Identify unusual consumption spikes or drops
- **Seasonal Trends**: Recognize seasonal patterns in your usage
- **Recharge Optimization**: Get personalized recharge timing and amount suggestions
- **Balance Forecasting**: Predict when your balance will run out
- **Cost Optimization**: Tips to reduce electricity costs

#### AI Insights Dashboard

- **Overall Summary**: High-level analysis of your consumption patterns
- **Critical Alerts**: Important anomalies or issues requiring attention
- **Actionable Tips**: Specific recommendations to optimize your usage
- **Trend Analysis**: Long-term patterns and seasonal variations

### 4. Smart Notifications

#### Enabling Notifications

1. Click the **"Notifications"** button in the header
2. Toggle **"Daily Notifications"** to enable
3. **Grant browser permission** when prompted
4. **Configure settings**:
   - Low balance threshold (default: ৳100)
   - Notification time (default: 3:00 PM BDT)

#### Notification Types

- **Low Balance Alerts**: When account balance falls below your threshold
- **Data Unavailable**: When account data is temporarily unavailable
- **Daily Summary**: Optional daily consumption summaries

#### Notification Settings

- **Threshold Configuration**: Set custom low balance amounts
- **Time Scheduling**: Choose when to receive daily notifications
- **Account Selection**: Enable/disable notifications per account
- **Test Notifications**: Send test notifications to verify setup

### 5. Language and Localization

#### Switching Languages

- **Header Language Switcher**: Click the language button in the top navigation
- **Onboarding Language**: Choose during first-time setup
- **Per-Account Language**: Set different languages for different accounts
- **AI Language**: AI insights adapt to your selected language

#### Supported Languages

- **English**: Full feature support with international formatting
- **Bangla (বাংলা)**: Complete translation with local formatting
- **Cultural Adaptation**: Date formats, number formats, and cultural preferences

## Advanced Features

### 1. Account Sharing

#### Creating Shared Links

1. **Open Account Dashboard**: Navigate to the account you want to share
2. **Click Share Button**: Look for the share icon in the dashboard header
3. **Generate Link**: Create a secure sharing link
4. **Share with Others**: Send the link to trusted colleagues or family

#### Shared Link Features

- **View-Only Access**: Shared users can view but not modify account data
- **Real-Time Data**: Shared dashboards show live account information
- **No Login Required**: Recipients don't need to create accounts
- **Secure Access**: Links are generated with security tokens

### 2. Data Export and Analysis

#### Exporting Data

- **Chart Data**: Export chart data as CSV or JSON
- **Consumption Reports**: Generate detailed consumption reports
- **Balance History**: Export balance change history
- **AI Insights**: Save AI analysis results

#### Data Analysis Tools

- **Trend Comparison**: Compare consumption across different time periods
- **Cost Analysis**: Analyze electricity costs and spending patterns
- **Efficiency Metrics**: Track improvements in consumption efficiency
- **Custom Date Ranges**: Analyze specific time periods

### 3. Performance Optimization

#### Caching and Speed

- **Intelligent Caching**: Frequently accessed data is cached for faster loading
- **Offline Support**: Basic functionality available without internet
- **Preloading**: Predictive loading of likely-needed data
- **Mobile Optimization**: Optimized performance on mobile devices

#### Data Management

- **Automatic Refresh**: Account data refreshes automatically
- **Manual Refresh**: Force refresh when needed
- **Cache Management**: Clear cache to ensure fresh data
- **Storage Optimization**: Efficient use of browser storage

## Troubleshooting

### Common Issues

#### Account Not Found
- **Verify Account Number**: Ensure you've entered the correct DESCO account number
- **Check Account Status**: Verify the account is active with DESCO
- **Try Again Later**: DESCO servers may be temporarily unavailable

#### AI Features Not Working
- **Check API Key**: Verify your Gemini API key is valid and properly configured
- **API Quota**: Ensure you haven't exceeded your API usage limits
- **Network Connection**: Verify you have a stable internet connection
- **Browser Compatibility**: Ensure your browser supports modern JavaScript features

#### Notifications Not Working
- **Browser Permissions**: Check that notifications are enabled in your browser
- **Service Worker**: Ensure service workers are supported and enabled
- **Background Processing**: Some browsers limit background processing
- **Notification Settings**: Verify notification settings are properly configured

#### Performance Issues
- **Clear Cache**: Clear browser cache and application data
- **Update Browser**: Ensure you're using a recent browser version
- **Check Network**: Verify stable internet connection
- **Reduce Data Range**: Use smaller date ranges for better performance

### Getting Help

#### Self-Help Resources
- **In-App Help**: Click the help button for contextual assistance
- **Documentation**: Refer to this user guide and technical documentation
- **FAQ Section**: Check frequently asked questions
- **Error Messages**: Read error messages carefully for specific guidance

#### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Community Discussions**: Join community discussions for tips and tricks
- **Documentation Updates**: Contribute to documentation improvements

## Privacy and Security

### Data Privacy

- **Local Storage**: All your data is stored locally on your device
- **No Server Storage**: DescoWise doesn't store your account data on servers
- **API Key Security**: Your Gemini API keys are encrypted and stored locally
- **No Tracking**: No user analytics or tracking implemented

### Security Best Practices

- **Secure API Keys**: Keep your Gemini API keys confidential
- **Shared Links**: Only share account links with trusted individuals
- **Browser Security**: Keep your browser updated for security patches
- **Regular Review**: Periodically review your account access and settings

## Tips and Best Practices

### Optimizing Your Experience

1. **Regular Monitoring**: Check your accounts regularly for unusual patterns
2. **Set Appropriate Thresholds**: Configure low balance alerts based on your usage
3. **Use AI Insights**: Leverage AI recommendations to optimize consumption
4. **Share Responsibly**: Only share account access with trusted individuals
5. **Keep Updated**: Use the latest version of DescoWise for best performance

### Cost Optimization

1. **Monitor Peak Usage**: Identify and reduce high-consumption periods
2. **Follow AI Recommendations**: Implement AI-suggested optimizations
3. **Track Trends**: Use trend analysis to understand consumption patterns
4. **Set Alerts**: Configure notifications to avoid service interruptions
5. **Regular Analysis**: Review monthly consumption reports for insights

### Troubleshooting Prevention

1. **Stable Internet**: Ensure reliable internet connection for real-time data
2. **Browser Maintenance**: Keep browser updated and clear cache regularly
3. **API Key Management**: Monitor API usage to avoid quota limits
4. **Backup Settings**: Note down your configuration for easy restoration
5. **Regular Testing**: Test notifications and features periodically

## Frequently Asked Questions

### General Questions

**Q: Is DescoWise official DESCO software?**
A: No, DescoWise is an unofficial client that uses DESCO's public APIs to provide enhanced account management features.

**Q: Is my data safe?**
A: Yes, all data is stored locally on your device. DescoWise doesn't store any account information on external servers.

**Q: Do I need to pay for DescoWise?**
A: DescoWise is free to use. You only pay for your own Gemini API usage if you choose to enable AI features.

### Technical Questions

**Q: Which browsers are supported?**
A: DescoWise works on all modern browsers including Chrome, Firefox, Safari, and Edge.

**Q: Can I use DescoWise on mobile?**
A: Yes, DescoWise is fully responsive and optimized for mobile devices.

**Q: How often is data updated?**
A: Account data is fetched in real-time when you view your dashboard. You can also manually refresh data anytime.

### Feature Questions

**Q: Can I manage multiple accounts?**
A: Yes, you can add and manage multiple DESCO accounts from a single DescoWise dashboard.

**Q: How do AI insights work?**
A: AI insights use Google's Gemini AI to analyze your consumption patterns and provide personalized recommendations.

**Q: Can I share my account with others?**
A: Yes, you can generate secure sharing links that allow others to view your account dashboard in read-only mode.
