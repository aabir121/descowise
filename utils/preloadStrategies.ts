/**
 * Preloading strategies for better performance and user experience
 */

// Cache for preloaded modules
const moduleCache = new Map<string, Promise<any>>();

/**
 * Preload a module with caching
 */
export function preloadModule<T>(moduleLoader: () => Promise<T>): Promise<T> {
  const moduleKey = moduleLoader.toString();
  
  if (moduleCache.has(moduleKey)) {
    return moduleCache.get(moduleKey)!;
  }
  
  const modulePromise = moduleLoader();
  moduleCache.set(moduleKey, modulePromise);
  
  return modulePromise;
}

/**
 * Preload chart components when user is likely to need them
 */
export function preloadChartComponents() {
  // Preload chart components with a small delay to not block initial render
  setTimeout(() => {
    preloadModule(() => import('../components/dashboard/ConsumptionChartSection'));
    preloadModule(() => import('../components/dashboard/ComparisonChartSection'));
  }, 1000);
  
  // Preload heavier components with more delay
  setTimeout(() => {
    preloadModule(() => import('../components/dashboard/RechargeVsConsumptionSection'));
    preloadModule(() => import('../components/dashboard/RechargeDistributionSection'));
    preloadModule(() => import('../components/dashboard/MaxDemandSection'));
    preloadModule(() => import('../components/dashboard/CumulativeConsumptionSection'));
    preloadModule(() => import('../components/dashboard/BoxPlotSection'));
    preloadModule(() => import('../components/dashboard/MonthlyCostTrendSection'));
  }, 2000);
}

/**
 * Preload dashboard components when user navigates to account list
 */
export function preloadDashboardComponents() {
  setTimeout(() => {
    preloadModule(() => import('../components/AccountDashboardView'));
  }, 500);
}

/**
 * Intelligent preloading based on user behavior
 */
export class IntelligentPreloader {
  private static instance: IntelligentPreloader;
  private userActions: string[] = [];
  private preloadedModules = new Set<string>();
  
  static getInstance(): IntelligentPreloader {
    if (!IntelligentPreloader.instance) {
      IntelligentPreloader.instance = new IntelligentPreloader();
    }
    return IntelligentPreloader.instance;
  }
  
  /**
   * Track user action for intelligent preloading
   */
  trackAction(action: string) {
    this.userActions.push(action);
    
    // Keep only last 10 actions
    if (this.userActions.length > 10) {
      this.userActions.shift();
    }
    
    this.analyzeAndPreload();
  }
  
  /**
   * Analyze user behavior and preload likely needed components
   */
  private analyzeAndPreload() {
    const recentActions = this.userActions.slice(-5);
    
    // If user is viewing account cards, preload dashboard
    if (recentActions.includes('view_account_card') && !this.preloadedModules.has('dashboard')) {
      this.preloadedModules.add('dashboard');
      preloadDashboardComponents();
    }
    
    // If user opened dashboard, preload chart components
    if (recentActions.includes('open_dashboard') && !this.preloadedModules.has('charts')) {
      this.preloadedModules.add('charts');
      preloadChartComponents();
    }
    
    // If user is interacting with charts, preload AI components
    if (recentActions.some(action => action.includes('chart')) && !this.preloadedModules.has('ai')) {
      this.preloadedModules.add('ai');
      setTimeout(() => {
        preloadModule(() => import('../ai/promptGenerators'));
      }, 1000);
    }
  }
  
  /**
   * Preload based on route
   */
  preloadForRoute(route: string) {
    switch (route) {
      case '/':
        // On home page, preload dashboard components
        preloadDashboardComponents();
        break;
      case '/dashboard':
        // On dashboard, preload chart components
        preloadChartComponents();
        break;
    }
  }
  
  /**
   * Preload on user interaction (hover, focus, etc.)
   */
  preloadOnInteraction(componentType: 'dashboard' | 'charts' | 'ai') {
    if (this.preloadedModules.has(componentType)) {
      return;
    }
    
    this.preloadedModules.add(componentType);
    
    switch (componentType) {
      case 'dashboard':
        preloadDashboardComponents();
        break;
      case 'charts':
        preloadChartComponents();
        break;
      case 'ai':
        preloadModule(() => import('../ai/promptGenerators'));
        break;
    }
  }
}

/**
 * Hook for using intelligent preloader
 */
export function useIntelligentPreloader() {
  const preloader = IntelligentPreloader.getInstance();
  
  return {
    trackAction: preloader.trackAction.bind(preloader),
    preloadForRoute: preloader.preloadForRoute.bind(preloader),
    preloadOnInteraction: preloader.preloadOnInteraction.bind(preloader)
  };
}

/**
 * Preload critical resources on app initialization
 */
export function preloadCriticalResources() {
  // These components are already statically imported, so no need to preload them
  // Removed console.log for cleaner production experience
}

/**
 * Resource hints for better loading performance
 */
export function addResourceHints() {
  // Add DNS prefetch for external resources
  const dnsPrefetchLinks = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];
  
  dnsPrefetchLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  });
  
  // Add preconnect for critical external resources
  const preconnectLinks = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];
  
  preconnectLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Service Worker registration for caching strategies and notifications
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, but the old Service Worker is still controlling the page.
                  // You can prompt the user to refresh here.
                  console.log('New content available! Please refresh.');
                  // Example: Dispatch a custom event or use a global state management to show a notification
                  const event = new CustomEvent('pwaUpdateAvailable', { detail: { newWorker } });
                  window.dispatchEvent(event);
                }
              });
            }
          });
        })
        .catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
        });
    });
  }
}
