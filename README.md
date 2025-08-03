# DescoWise

> Be wise with your DESCO account: your electricity accounts, simplified.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)

**DescoWise** is a modern, privacy-focused web application for managing DESCO (Dhaka Electric Supply Company Limited) electricity accounts. It provides an enhanced dashboard experience with AI-powered insights, advanced analytics, and comprehensive account management features.

## 🎯 What is DescoWise?

DescoWise is an **unofficial client** that enhances your DESCO account management experience by providing:

- **🤖 AI-Powered Insights**: Get intelligent analysis of your consumption patterns, anomaly detection, and personalized recommendations
- **📊 Advanced Analytics**: Interactive charts, trend analysis, and detailed consumption breakdowns
- **🔔 Smart Notifications**: Daily balance monitoring with customizable alerts and thresholds
- **🌐 Bilingual Support**: Full English and Bangla language support with seamless switching
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🔒 Privacy-First**: Your API keys and data stay on your device - no server-side storage
- **⚡ Performance Optimized**: Fast loading with intelligent caching and preloading strategies

## 🙏 Acknowledgments

This application is built using the **open APIs provided by DESCO (Dhaka Electric Supply Company Limited)**. I'm incredibly grateful to DESCO for making their customer data APIs publicly available, which allows developers like me to create convenient tools for customers.

While DESCO already provides excellent official Android and iOS apps, as well as their web portal, I found myself wanting a more personalized dashboard experience. This project is my attempt to create something that feels more convenient for my own usage patterns - with AI-powered insights, better data visualization, and a modern interface.

**Thank you, DESCO, for your commitment to transparency and customer service through open APIs!** 🙏

## � Table of Contents

- [🚀 Key Features](#-key-features)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🚀 Deployment](#-deployment)
- [🔧 Development](#-development)
- [🔑 How It Works](#-how-it-works)
- [📚 Documentation](#-documentation)
- [🎯 User Experience](#-user-experience)
- [🛠️ Tech Stack](#️-tech-stack)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙋‍♂️ Support & Community](#️-support--community)

## �🚀 Key Features

### 📊 **Account Management**
- **Multi-Account Support**: Manage multiple DESCO accounts from a single dashboard
- **Real-Time Balance Tracking**: Live balance updates with automatic refresh
- **Account Verification**: Instant account validation using DESCO APIs
- **Custom Display Names**: Personalize account names for easy identification
- **Account Sharing**: Share account dashboards with trusted colleagues via secure links

### 🤖 **AI-Powered Analytics**
- **Consumption Pattern Analysis**: Intelligent analysis of your electricity usage patterns
- **Anomaly Detection**: Automatic detection of unusual consumption spikes or patterns
- **Predictive Insights**: Balance depletion forecasts and consumption predictions
- **Personalized Recommendations**: Smart recharge timing and amount suggestions
- **Seasonal Trend Analysis**: Understanding of seasonal consumption variations
- **Multi-Language AI**: AI insights available in both English and Bangla

### 📈 **Advanced Data Visualization**
- **Interactive Charts**: Recharts-powered visualizations with zoom, pan, and filtering
- **Multiple Chart Types**: Line charts, bar charts, box plots, and cumulative views
- **Consumption Trends**: Daily, monthly, and yearly consumption analysis
- **Recharge vs Consumption**: Comparative analysis of recharge patterns vs usage
- **Peak Usage Alerts**: Identification of high-consumption periods
- **Mobile-Optimized Charts**: Touch-friendly charts optimized for mobile devices

### 🔔 **Smart Notification System**
- **Daily Balance Monitoring**: Automated daily checks at 3:00 PM Bangladesh Time
- **Low Balance Alerts**: Customizable threshold-based notifications
- **Data Availability Alerts**: Notifications when account data is unavailable
- **Browser Push Notifications**: Native browser notifications with service worker support
- **Offline Queuing**: Notifications queued when offline and delivered when online
- **Duplicate Prevention**: Smart logic to prevent notification spam

### 🌐 **Internationalization & Accessibility**
- **Full Bilingual Support**: Complete English and Bangla translations
- **Dynamic Language Switching**: Change language without page reload
- **Cultural Localization**: Date formats, number formats, and cultural preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility Features**: Screen reader support and keyboard navigation

### 🔒 **Privacy & Security**
- **Client-Side Storage**: All data stored locally on your device
- **No Server-Side API Keys**: Your Gemini API keys never leave your device
- **Encrypted Local Storage**: API keys stored with basic encryption
- **No User Tracking**: Privacy-focused design with no analytics or tracking
- **Secure API Communication**: Direct communication with DESCO APIs

## 🏗️ Architecture Overview

DescoWise is built with a modern, scalable architecture designed for performance and maintainability:

### **Frontend Architecture**
- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript**: Full type safety throughout the application
- **Vite**: Lightning-fast build tool with HMR and optimized bundling
- **React Router**: Client-side routing with lazy loading and code splitting

### **State Management**
- **Custom Hooks**: Centralized state management using React hooks
- **Local Storage**: Persistent storage for user preferences and account data
- **Context API**: Global state for modals, notifications, and UI state

### **Data Layer**
- **Service Layer**: Abstracted API communication with error handling
- **Type-Safe APIs**: Full TypeScript interfaces for all data structures
- **Caching Strategy**: Intelligent caching with cache invalidation
- **Offline Support**: Service worker for offline functionality

### **UI/UX Architecture**
- **Component Library**: Reusable, accessible components
- **Design System**: Consistent styling with Tailwind CSS
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Performance Optimization**: Lazy loading, code splitting, and preloading

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/descowise.git
   cd descowise
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional):**
   Create a `.env.local` file in the project root:
   ```bash
   # Optional: Customize AI model settings
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_TEMPERATURE=0.3
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` to see the application.

### First-Time Setup
1. **Complete Onboarding**: Choose your preferred language and learn about the features
2. **Add Your First Account**: Enter a valid DESCO account number
3. **Configure AI Features** (optional): Add your Gemini API key for AI insights
4. **Set Up Notifications** (optional): Enable daily balance monitoring

## 📁 Project Structure

```
descowise/
├── 📁 components/           # React components
│   ├── 📁 account/         # Account-specific components
│   ├── 📁 common/          # Reusable UI components
│   ├── 📁 dashboard/       # Dashboard views and sections
│   └── 📁 settings/        # Settings and configuration
├── 📁 services/            # API services and business logic
│   ├── descoService.ts     # DESCO API integration
│   ├── notificationService.ts # Push notification system
│   └── ...                 # Other specialized services
├── 📁 hooks/               # Custom React hooks
├── 📁 utils/               # Utility functions and helpers
│   ├── 📁 locales/        # Translation files
│   ├── api.ts             # API utilities
│   ├── balanceCalculations.ts # Balance calculation logic
│   └── ...                # Other utilities
├── 📁 ai/                  # AI-related functionality
├── 📁 docs/                # Detailed documentation
├── 📁 scripts/             # Deployment and build scripts
├── 📁 tests/               # Test files
├── types.ts                # TypeScript type definitions
└── App.tsx                 # Main application component
```

## 🚀 Deployment

DescoWise uses a privacy-focused deployment strategy where users provide their own Gemini API keys:

### Quick Deployment

```bash
# Deploy to Vercel with automatic configuration
npm run deploy

# Or use platform-specific scripts
./scripts/deploy.sh      # Linux/Mac
scripts\deploy.bat       # Windows
```

### Manual Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform:**
   - **Vercel**: `vercel --prod`
   - **Netlify**: `netlify deploy --prod --dir=dist`
   - **GitHub Pages**: Push to `gh-pages` branch
   - **Any Static Host**: Upload the `dist/` folder

### Environment Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_MODEL` | AI model to use | `gemini-2.5-flash` | No |
| `GEMINI_TEMPERATURE` | AI creativity level | `0.3` | No |

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with HMR
npm run build        # Build for production
npm run preview      # Preview production build locally

# Deployment
npm run deploy       # Deploy to Vercel
npm run deploy:win   # Deploy on Windows

# Testing
npm test             # Run test suite (when available)
```

### Development Workflow

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Make Changes:**
   - Components are in `components/`
   - Services are in `services/`
   - Utilities are in `utils/`
   - Types are in `types.ts`

3. **Test Your Changes:**
   - Add test accounts using valid DESCO account numbers
   - Test AI features with a valid Gemini API key
   - Test notifications in supported browsers

4. **Build and Deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

### Code Style and Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting (when configured)
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

## 🔑 How It Works

### Privacy-First Architecture
- ✅ **User-Controlled API Keys**: Users provide their own Gemini API keys during onboarding
- ✅ **Local Storage**: API keys are stored securely on the user's device with basic encryption
- ✅ **No Server-Side Storage**: Zero server-side storage of sensitive user data
- ✅ **Direct API Communication**: App communicates directly with DESCO and Google APIs
- ✅ **Cost Control**: Users control their own AI API costs and usage

### AI Features
- 🤖 **Optional AI Insights**: AI features are completely optional and user-controlled
- 🔒 **Secure Processing**: AI analysis happens client-side with user's API key
- 📊 **Intelligent Caching**: AI responses are cached to minimize API calls and costs
- 🌐 **Multilingual AI**: AI insights available in both English and Bangla
- ⚡ **Fallback Mode**: Basic analytics available even without AI features

### Sharing and Collaboration
- 🔗 **Account Sharing**: Share specific account dashboards via secure links
- 👥 **Team Access**: Share your API key with trusted colleagues for easy access
- 🏢 **Single Deployment**: One deployment serves multiple users with their own API keys

## 📚 Documentation

### **📖 Complete Documentation Hub**
**[📁 Documentation Directory](docs/)** - Comprehensive documentation for all users

### **🎯 Quick Access by Role**

#### **👤 For End Users**
- **[📖 User Guide](docs/USER_GUIDE.md)** - Complete user manual with step-by-step instructions
- **[🚀 Quick Start](#-quick-start)** - Get up and running in minutes
- **[❓ FAQ](docs/USER_GUIDE.md#frequently-asked-questions)** - Common questions and answers

#### **👨‍💻 For Developers**
- **[🛠️ Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Setup, workflow, and contribution guidelines
- **[🏗️ Architecture Documentation](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[🤝 Contributing Guidelines](#-contributing)** - How to contribute to the project

#### **🚀 For Deployment**
- **[📋 Deployment Guide](DEPLOYMENT.md)** - Detailed deployment instructions
- **[⚙️ Environment Configuration](#environment-configuration)** - Configuration options
- **[🔒 Security Considerations](DEPLOYMENT.md#security-considerations)** - Security best practices

### **🔧 System Documentation**
- **[🔑 API Key Management System](docs/API_KEY_MANAGEMENT_SYSTEM.md)** - Comprehensive API key management guide
- **[🔔 Notification System](docs/NOTIFICATION_SYSTEM.md)** - Push notification system documentation
- **[🏗️ Architecture Overview](docs/ARCHITECTURE.md)** - Technical architecture deep-dive

### **📊 Feature Documentation**
- **Account Management**: Multi-account support with verification and sharing
- **Dashboard Analytics**: Interactive charts and real-time data visualization
- **AI Integration**: Gemini AI integration for insights and predictions
- **Smart Notifications**: Daily monitoring with customizable alerts
- **Internationalization**: Complete bilingual support (English/Bangla)
- **Performance Optimization**: Caching, preloading, and mobile optimization

## 🎯 User Experience

### First-Time User Onboarding

DescoWise includes a comprehensive onboarding experience:

#### 🎯 **What it covers:**
- **Welcome & Introduction**: Explains what DescoWise is and why it exists alongside the official DESCO portal
- **Language Selection**: Choose between English and Bangla as your preferred language
- **Key Features Overview**: Highlights main benefits including AI insights, privacy, and cost optimization
- **How It Works**: Simple 3-step guide explaining account setup and usage process
- **Privacy & Disclaimer**: Clear explanation that this is an unofficial client with privacy-first approach

#### 🔧 **Technical Implementation:**
- Shows only on first visit (stored in localStorage)
- Language selection immediately updates the app interface
- Responsive design that works on all device sizes
- Can be reset for testing by uncommenting a line in the code

#### 🌐 **Bilingual Support:**
- Complete translations for all onboarding content
- Seamless language switching during onboarding
- Language preference persists across sessions

### Account Management Flow
1. **Add Account**: Enter DESCO account number for instant verification
2. **View Dashboard**: Access comprehensive analytics and insights
3. **Configure AI**: Optionally add Gemini API key for AI features
4. **Set Notifications**: Enable daily balance monitoring
5. **Share Access**: Generate secure links for account sharing

## 🛠️ Tech Stack

### **Frontend Framework**
- **[React 19](https://reactjs.org/)** - Latest React with concurrent features and improved performance
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Full type safety and enhanced developer experience
- **[Vite 6.2](https://vitejs.dev/)** - Lightning-fast build tool with HMR and optimized bundling

### **UI & Styling**
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[Recharts 3.0](https://recharts.org/)** - Composable charting library built on React components
- **[React Router 7.7](https://reactrouter.com/)** - Declarative routing for React applications

### **AI & Analytics**
- **[Google Gemini API](https://ai.google.dev/)** - Advanced AI for consumption analysis and insights
- **Custom Analytics Engine** - Proprietary algorithms for consumption pattern analysis

### **Internationalization**
- **[react-i18next 15.6](https://react.i18next.com/)** - Internationalization framework for React
- **[i18next 25.3](https://www.i18next.com/)** - Complete i18n solution with pluralization and context

### **Performance & Optimization**
- **Service Workers** - Background processing and offline support
- **Intelligent Caching** - Smart caching strategies for API responses
- **Code Splitting** - Lazy loading for optimal bundle sizes
- **Preloading Strategies** - Predictive resource loading

### **Development Tools**
- **[Vite](https://vitejs.dev/)** - Fast development server with HMR
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking
- **[PostCSS](https://postcss.org/)** - CSS processing and optimization

### **Deployment & Infrastructure**
- **[Vercel](https://vercel.com/)** - Serverless deployment platform
- **Static Site Generation** - Pre-built static assets for optimal performance
- **CDN Distribution** - Global content delivery network

## 🤝 Contributing

We welcome contributions to DescoWise! Here's how you can help:

### **Getting Started**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### **Contribution Guidelines**
- Follow the existing code style and conventions
- Add TypeScript types for all new code
- Test your changes with real DESCO accounts
- Update documentation for new features
- Ensure responsive design works on all devices

### **Areas for Contribution**
- 🐛 Bug fixes and performance improvements
- 🌟 New features and enhancements
- 📚 Documentation improvements
- 🌐 Translation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **What this means:**
- ✅ **Commercial Use**: You can use this project for commercial purposes
- ✅ **Modification**: You can modify and distribute modified versions
- ✅ **Distribution**: You can distribute the original or modified versions
- ✅ **Private Use**: You can use this project for private purposes
- ❗ **Limitation**: The software is provided "as is" without warranty

---

## 🙋‍♂️ Support & Community

### **Getting Help**
- 📖 Check the [documentation](docs/) for detailed guides
- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/descowise/issues)
- 💡 Request features via [GitHub Discussions](https://github.com/yourusername/descowise/discussions)

### **Community**
- ⭐ Star the repository if you find it useful
- 🍴 Fork the project to contribute
- 📢 Share with others who might benefit

### **Disclaimer**
DescoWise is an **unofficial client** for DESCO services. It is not affiliated with, endorsed by, or connected to DESCO (Dhaka Electric Supply Company Limited). This project is developed independently using publicly available APIs.

---

<div align="center">

**Made with ❤️ for the DESCO community**

[⭐ Star on GitHub](https://github.com/aabir121/descowise) • [📖 Documentation](docs/) • [🚀 Deploy Now](DEPLOYMENT.md)

</div>
