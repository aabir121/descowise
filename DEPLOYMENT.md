# DescoWise Dual-Deployment Strategy

This document explains how to deploy DescoWise in two distinct configurations to manage Gemini API costs effectively.

## Overview

DescoWise supports two deployment types:

1. **Premium Version**: Pre-configured with your personal Gemini API key
2. **Standard Version**: Users provide their own Gemini API keys

## Deployment Types

### Premium Version
- **Purpose**: Personal use or invited users
- **API Key**: Pre-configured with your personal key
- **AI Features**: Enabled by default for all users
- **Cost**: You bear all API costs
- **Access**: Can be password-protected or invitation-only

### Standard Version
- **Purpose**: Public access
- **API Key**: Users configure their own keys during onboarding
- **AI Features**: Only available if user provides valid API key
- **Cost**: Users bear their own API costs
- **Access**: Open to public

## Quick Deployment

> 📖 **For setting up two different URLs, see [DUAL_URL_SETUP.md](DUAL_URL_SETUP.md)**

### Using NPM Scripts (Recommended)

**Premium Version:**
```bash
# Deploy to separate project with custom name
GEMINI_API_KEY=your_actual_api_key_here PROJECT_NAME=descowise-premium npm run deploy:premium
```

**Standard Version:**
```bash
# Deploy to separate project with custom name
PROJECT_NAME=descowise-standard npm run deploy:standard
```

This will create two separate Vercel projects:
- Premium: `https://descowise-premium.vercel.app`
- Standard: `https://descowise-standard.vercel.app`

### Using Shell Scripts Directly

**Linux/Mac:**
```bash
# Premium
GEMINI_API_KEY=your_actual_api_key_here ./scripts/deploy-premium.sh

# Standard
./scripts/deploy-standard.sh
```

**Windows:**
```cmd
# Premium
set GEMINI_API_KEY=your_actual_api_key_here && scripts\deploy-premium.bat

# Standard
scripts\deploy-standard.bat
```

## Manual Deployment

### Prerequisites

1. Install Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Link your project: `vercel link`

### Premium Deployment

1. **Set Environment Variables in Vercel Dashboard:**
   ```
   DEPLOYMENT_TYPE=premium
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-2.5-flash (optional)
   GEMINI_TEMPERATURE=0.3 (optional)
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

### Standard Deployment

1. **Set Environment Variables in Vercel Dashboard:**
   ```
   DEPLOYMENT_TYPE=standard
   GEMINI_MODEL=gemini-2.5-flash (optional)
   GEMINI_TEMPERATURE=0.3 (optional)
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## Environment Variables

| Variable | Premium | Standard | Description |
|----------|---------|----------|-------------|
| `DEPLOYMENT_TYPE` | `premium` | `standard` | Determines deployment configuration |
| `GEMINI_API_KEY` | **Required** | Not set | Your personal Gemini API key |
| `GEMINI_MODEL` | Optional | Optional | AI model to use (default: gemini-2.5-flash) |
| `GEMINI_TEMPERATURE` | Optional | Optional | AI temperature setting (default: 0.3) |

## User Experience Differences

### Premium Version
- No API key setup required
- AI insights work immediately
- All features available out-of-the-box
- Branded as "DescoWise Premium"

### Standard Version
- Optional API key setup during onboarding
- AI features disabled without user API key
- Clear messaging about feature availability
- Users can manage their API keys
- Branded as "DescoWise"

## Security Considerations

### Premium Version
- Your API key is embedded in the build
- Secure your deployment URL
- Consider password protection
- Monitor API usage regularly

### Standard Version
- User API keys stored locally (encrypted)
- No server-side API key storage
- Users control their own costs
- Privacy-focused design

## Monitoring and Management

### Premium Version Monitoring
- Set up API usage alerts in Google Cloud Console
- Monitor costs regularly
- Consider usage limits
- Track user activity

### Standard Version Management
- No API cost monitoring needed
- Focus on user experience
- Provide clear API key setup instructions
- Support users with API key issues

## Best Practices

### For Premium Deployment
1. Use a dedicated Google Cloud project
2. Set up billing alerts
3. Implement usage monitoring
4. Consider rate limiting
5. Secure the deployment URL

### For Standard Deployment
1. Provide clear API key instructions
2. Test the onboarding flow thoroughly
3. Handle API key errors gracefully
4. Offer support for API key setup
5. Monitor user feedback

## Troubleshooting

### Common Issues

**Premium deployment fails:**
- Check if GEMINI_API_KEY is valid
- Verify API key has necessary permissions
- Ensure billing is enabled in Google Cloud

**Standard deployment - users can't enable AI:**
- Verify API key setup flow works
- Check error messages are clear
- Test with different API keys
- Ensure validation is working

**API key validation fails:**
- Check network connectivity
- Verify API key format
- Test with known good API key
- Check Google AI Studio status

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API key separately
4. Review browser console for errors

For user issues (Standard version):
1. Guide users to Google AI Studio
2. Help with API key format
3. Test API key validation
4. Check local storage permissions
