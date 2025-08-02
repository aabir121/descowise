# DescoWise

> Be wise with your Desco account: your electricity accounts, simplified.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern web application to manage your DESCO electricity accounts, view balances, consumption data, and get AI-powered insights.

## 🙏 Acknowledgments

This application is built using the **open APIs provided by DESCO (Dhaka Electric Supply Company Limited)**. I'm incredibly grateful to DESCO for making their customer data APIs publicly available, which allows developers like me to create convenient tools for customers.

While DESCO already provides excellent official Android and iOS apps, as well as their web portal, I found myself wanting a more personalized dashboard experience. This project is my attempt to create something that feels more convenient for my own usage patterns - with AI-powered insights, better data visualization, and a modern interface.

**Thank you, DESCO, for your commitment to transparency and customer service through open APIs!** 🙏

## Features

- 📊 Real-time account balance and consumption tracking
- 📈 Interactive charts and analytics  
- 🤖 AI-powered consumption insights and anomaly detection
- 💳 Recharge history and payment tracking
- 📱 Responsive design for all devices
- 🌐 Bilingual support (English & Bangla)
- 🎯 First-time user onboarding with language selection
- 🔗 Integration with official DESCO APIs

## Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the project root:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your Gemini API key from: https://makersuite.google.com/app/apikey

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Deployment

Deploy DescoWise where users provide their own Gemini API keys:

```bash
npm run deploy
```

Or use the script directly:

```bash
./scripts/deploy.sh
```

### Manual Vercel Deployment

1. **Push your code to GitHub**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Set environment variables (optional):**
   - In your Vercel project dashboard, go to **Settings → Environment Variables**
   - Add `GEMINI_MODEL=gemini-2.5-flash` (optional, this is the default)
   - Add `GEMINI_TEMPERATURE=0.3` (optional, this is the default)
   - Select all environments (Production, Preview, Development)
   - Click "Save"

4. **Deploy:**
   - Vercel will automatically deploy on every push to your main branch
   - Your app will be available at your Vercel URL

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_MODEL` | AI model to use (default: `gemini-2.5-flash`) | Optional |
| `GEMINI_TEMPERATURE` | AI temperature setting (default: `0.3`) | Optional |

## How It Works

- ✅ Users provide their own Gemini API keys during onboarding
- ✅ API keys are stored securely on the user's device
- ✅ Users control their own API costs and usage
- ✅ Privacy-focused (no server-side API key storage)
- ✅ AI features are optional and user-controlled
- 💡 Share your API key with trusted colleagues for easy access

## First-Time User Onboarding

DescoWise includes a comprehensive onboarding experience for new users that:

### 🎯 **What it covers:**
- **Welcome & Introduction**: Explains what DescoWise is and why it exists alongside the official DESCO portal
- **Language Selection**: Allows users to choose between English and Bangla as their preferred language
- **Key Features Overview**: Highlights the main benefits including AI insights, privacy, and cost optimization
- **How It Works**: Simple 3-step guide explaining the account setup and usage process
- **Privacy & Disclaimer**: Clear explanation that this is an unofficial client with privacy-first approach

### 🔧 **Technical Implementation:**
- Shows only on first visit (stored in localStorage)
- Language selection immediately updates the app interface
- Responsive design that works on all device sizes
- Can be reset for testing by uncommenting a line in the code

### 🌐 **Bilingual Support:**
- Complete translations for all onboarding content
- Seamless language switching during onboarding
- Language preference persists across sessions

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Deployment**: Vercel
- **Internationalization**: react-i18next

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
