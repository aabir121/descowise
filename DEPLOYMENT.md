# DescoWise Deployment Guide

This document explains how to deploy DescoWise with user-provided API key configuration.

## Overview

DescoWise uses a single deployment strategy where users provide their own Gemini API keys during onboarding. This approach offers:

- **Cost Control**: Users pay for their own API usage
- **Privacy**: API keys are stored locally on user devices
- **Flexibility**: Share your API key with trusted colleagues
- **Simplicity**: Single deployment to maintain

## Quick Deployment

### Using NPM Scripts (Recommended)

```bash
npm run deploy
```

### Using Shell Scripts Directly

**Linux/Mac:**
```bash
./scripts/deploy.sh
```

**Windows:**
```cmd
scripts\deploy.bat
```

### Custom Project Name

```bash
PROJECT_NAME=my-descowise npm run deploy
```

## Manual Deployment

### Prerequisites

1. Install Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Link your project: `vercel link`

### Deployment Steps

1. **Set Environment Variables in Vercel Dashboard (Optional):**
   ```
   GEMINI_MODEL=gemini-2.5-flash (optional, default)
   GEMINI_TEMPERATURE=0.3 (optional, default)
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_MODEL` | AI model to use (default: gemini-2.5-flash) | Optional |
| `GEMINI_TEMPERATURE` | AI temperature setting (default: 0.3) | Optional |

## User Experience

- Users are guided through onboarding to set up their Gemini API key
- AI features are disabled until user provides a valid API key
- Clear messaging about feature availability and setup process
- Users can manage their API keys through the settings
- Privacy-focused: API keys stored locally, never on servers

## Security Considerations

- User API keys are stored locally with basic encryption
- No server-side API key storage
- Users control their own costs and usage
- Privacy-focused design
- API keys never leave the user's device

## Sharing with Colleagues

To share DescoWise with trusted colleagues:

1. **Deploy once** using the instructions above
2. **Share the deployment URL** with your colleagues
3. **Share your Gemini API key** with them directly
4. **Colleagues configure the API key** during their onboarding

This approach gives you:
- ✅ Single deployment to maintain
- ✅ Cost control (you monitor API usage)
- ✅ Easy access for trusted users
- ✅ No complex authentication setup needed

## Best Practices

1. Provide clear API key instructions to users
2. Test the onboarding flow thoroughly
3. Handle API key errors gracefully
4. Offer support for API key setup
5. Monitor user feedback
6. Keep deployment URL secure if sharing with limited users

## Troubleshooting

### Common Issues

**Deployment fails:**
- Check Vercel deployment logs
- Verify build process completes
- Ensure all dependencies are installed

**Users can't enable AI features:**
- Verify API key setup flow works
- Check error messages are clear
- Test with different API keys
- Ensure validation is working

**API key validation fails:**
- Check network connectivity
- Verify API key format (should start with 'AIza')
- Test with known good API key
- Check Google AI Studio status

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Test locally with `npm run dev`
4. Verify all scripts are executable

For user issues:
1. Guide users to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Help with API key format validation
3. Test API key validation flow
4. Check browser local storage permissions
