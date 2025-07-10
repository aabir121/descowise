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

## Deploy to Vercel

1. **Push your code to GitHub**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Set environment variables:**
   - In your Vercel project dashboard, go to **Settings → Environment Variables**
   - Add: `GEMINI_API_KEY` = your actual Gemini API key
   - Select all environments (Production, Preview, Development)
   - Click "Save"

4. **Deploy:**
   - Vercel will automatically deploy on every push to your main branch
   - Your app will be available at your Vercel URL

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI insights | Yes (for AI features) |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Deployment**: Vercel

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
