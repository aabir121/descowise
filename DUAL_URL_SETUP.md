# Setting Up Two Different URLs for Dual Deployment

This guide explains how to deploy DescoWise to two different URLs on Vercel for your dual-deployment strategy.

## Method 1: Two Separate Vercel Projects (Recommended)

### Step 1: Initial Setup

1. **Ensure you have Vercel CLI installed:**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Navigate to your project directory:**
   ```bash
   cd your-descowise-project
   ```

### Step 2: Deploy Premium Version

```bash
# Deploy premium version with custom project name
GEMINI_API_KEY=your_actual_api_key_here PROJECT_NAME=descowise-premium npm run deploy:premium
```

This will create a project at: `https://descowise-premium.vercel.app`

### Step 3: Deploy Standard Version

```bash
# Deploy standard version with custom project name  
PROJECT_NAME=descowise-standard npm run deploy:standard
```

This will create a project at: `https://descowise-standard.vercel.app`

### Step 4: Configure Environment Variables in Vercel Dashboard

**For Premium Project (`descowise-premium`):**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select `descowise-premium` project
3. Go to Settings → Environment Variables
4. Add these variables:
   ```
   DEPLOYMENT_TYPE=premium
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_TEMPERATURE=0.3
   ```

**For Standard Project (`descowise-standard`):**
1. Select `descowise-standard` project
2. Go to Settings → Environment Variables  
3. Add these variables:
   ```
   DEPLOYMENT_TYPE=standard
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_TEMPERATURE=0.3
   ```

## Method 2: Using Custom Domain Names

### Step 1: Purchase Domain Names (Optional)

You can use custom domains for better branding:
- Premium: `premium.yoursite.com` or `pro.yoursite.com`
- Standard: `yoursite.com` or `app.yoursite.com`

### Step 2: Configure Custom Domains in Vercel

**For Premium Project:**
1. Go to Vercel Dashboard → `descowise-premium` → Settings → Domains
2. Add your premium domain (e.g., `premium.yoursite.com`)
3. Follow Vercel's DNS configuration instructions

**For Standard Project:**
1. Go to Vercel Dashboard → `descowise-standard` → Settings → Domains
2. Add your standard domain (e.g., `yoursite.com`)
3. Follow Vercel's DNS configuration instructions

## Method 3: Using Git Branches (Alternative)

### Step 1: Create Separate Branches

```bash
# Create premium branch
git checkout -b premium
git push origin premium

# Create standard branch  
git checkout -b standard
git push origin standard
```

### Step 2: Deploy Each Branch to Separate Projects

```bash
# Deploy premium branch
git checkout premium
vercel --prod --name descowise-premium

# Deploy standard branch
git checkout standard  
vercel --prod --name descowise-standard
```

## Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy-premium:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Premium
        run: |
          npm install -g vercel
          vercel --prod --name descowise-premium --token ${{ secrets.VERCEL_TOKEN }} --env DEPLOYMENT_TYPE=premium --env GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}

  deploy-standard:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Standard
        run: |
          npm install -g vercel
          vercel --prod --name descowise-standard --token ${{ secrets.VERCEL_TOKEN }} --env DEPLOYMENT_TYPE=standard
```

## Managing Both Deployments

### Quick Commands

```bash
# Deploy both versions at once
npm run deploy:premium && npm run deploy:standard

# Deploy with custom project names
PROJECT_NAME=my-premium-app GEMINI_API_KEY=your_key npm run deploy:premium
PROJECT_NAME=my-standard-app npm run deploy:standard

# Deploy to specific Vercel team/organization
vercel --prod --name descowise-premium --scope your-team-name
```

### Environment Variables for Scripts

You can set these in your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export GEMINI_API_KEY="your_actual_api_key_here"
export GEMINI_MODEL="gemini-2.5-flash"
export GEMINI_TEMPERATURE="0.3"
export PREMIUM_PROJECT_NAME="descowise-premium"
export STANDARD_PROJECT_NAME="descowise-standard"
```

## URL Structure Examples

After deployment, you'll have:

**Default Vercel URLs:**
- Premium: `https://descowise-premium.vercel.app`
- Standard: `https://descowise-standard.vercel.app`

**With Custom Domains:**
- Premium: `https://premium.descowise.com`
- Standard: `https://descowise.com`

**With Subdomains:**
- Premium: `https://pro.descowise.com`
- Standard: `https://app.descowise.com`

## Security Considerations

### Premium Deployment
- Consider password protection or IP restrictions
- Monitor API usage closely
- Use environment variables for sensitive data
- Consider using Vercel's password protection feature

### Standard Deployment
- Ensure proper error handling for API key issues
- Monitor user feedback for API key setup problems
- Consider rate limiting if needed

## Troubleshooting

### Common Issues

**"Project already exists" error:**
```bash
# Delete existing project first
vercel remove descowise-premium
# Then redeploy
```

**Environment variables not updating:**
- Clear Vercel cache: `vercel --prod --force`
- Check environment variable scope (Production/Preview/Development)

**Different behavior between deployments:**
- Verify `DEPLOYMENT_TYPE` is set correctly
- Check browser cache and localStorage
- Test in incognito mode

### Verification Commands

```bash
# Check which projects you have
vercel ls

# Check project details
vercel inspect descowise-premium
vercel inspect descowise-standard

# View deployment logs
vercel logs descowise-premium
vercel logs descowise-standard
```

## Best Practices

1. **Use descriptive project names** that clearly indicate the deployment type
2. **Set up monitoring** for both deployments
3. **Test both versions** after each deployment
4. **Document the URLs** for your team/users
5. **Use environment-specific configurations** appropriately
6. **Monitor costs** especially for the premium deployment
7. **Keep deployment scripts updated** with your project names

This setup gives you complete control over both deployments while maintaining the same codebase!
