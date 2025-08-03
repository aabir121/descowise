// @ts-nocheck
import { AiSummary, MonthlyConsumption, RechargeHistoryItem, BalanceData, DailyConsumption } from '../types';

interface CachedAiResponse {
  data: AiSummary;
  timestamp: number;
  accountNo: string;
  dataHash: string; // Hash of the input data to detect changes
}

interface CacheMetadata {
  lastFetch: number;
  accountNo: string;
  isStale: boolean;
}

// Cache configuration
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours maximum lifetime
const CACHE_KEY_PREFIX = 'ai_cache_';
const CACHE_METADATA_KEY = 'ai_cache_metadata_';
const DAILY_RESET_KEY = 'ai_cache_daily_reset_';

// Bangladesh Time (UTC+6) daily reset configuration
const BANGLADESH_TIMEZONE_OFFSET = 6 * 60 * 60 * 1000; // UTC+6 in milliseconds

/**
 * Get the next daily reset time (11:59 PM Bangladesh Time)
 */
function getNextDailyResetTime(): number {
  const now = new Date();
  const bangladeshTime = new Date(now.getTime() + BANGLADESH_TIMEZONE_OFFSET);

  // Set to 11:59 PM Bangladesh Time today
  const resetTime = new Date(bangladeshTime);
  resetTime.setHours(23, 59, 0, 0);

  // If we've already passed 11:59 PM today, set for tomorrow
  if (bangladeshTime.getTime() > resetTime.getTime()) {
    resetTime.setDate(resetTime.getDate() + 1);
  }

  // Convert back to UTC
  return resetTime.getTime() - BANGLADESH_TIMEZONE_OFFSET;
}

/**
 * Check if daily reset time has passed
 */
function shouldPerformDailyReset(): boolean {
  try {
    const lastResetKey = DAILY_RESET_KEY + 'timestamp';
    const lastReset = localStorage.getItem(lastResetKey);

    if (!lastReset) {
      return true; // First time, perform reset
    }

    const lastResetTime = parseInt(lastReset, 10);
    const nextResetTime = getNextDailyResetTime();
    const now = Date.now();

    // Check if we've passed the daily reset time since last reset
    return now >= nextResetTime && now > lastResetTime;
  } catch (error) {
    console.warn('Error checking daily reset:', error);
    return false;
  }
}

/**
 * Perform daily cache reset
 */
function performDailyReset(): void {
  try {
    console.log('Performing daily AI cache reset at Bangladesh 11:59 PM');
    clearAllCaches();

    // Record the reset time
    const lastResetKey = DAILY_RESET_KEY + 'timestamp';
    localStorage.setItem(lastResetKey, Date.now().toString());
  } catch (error) {
    console.warn('Error performing daily reset:', error);
  }
}

/**
 * Generate a hash of the input data to detect changes
 */
function generateDataHash(
  monthlyConsumption: MonthlyConsumption[],
  rechargeHistory: RechargeHistoryItem[],
  balanceData: BalanceData | null,
  dailyConsumption: DailyConsumption[]
): string {
  const dataToHash = {
    monthlyCount: monthlyConsumption.length,
    lastMonthConsumption: monthlyConsumption[monthlyConsumption.length - 1]?.consumedTaka || 0,
    rechargeCount: rechargeHistory.length,
    lastRecharge: rechargeHistory[rechargeHistory.length - 1]?.totalAmount || 0,
    balance: balanceData?.balance || 0,
    dailyCount: dailyConsumption.length,
    lastDailyConsumption: dailyConsumption[dailyConsumption.length - 1]?.consumedTaka || 0
  };
  
  return btoa(JSON.stringify(dataToHash));
}

/**
 * Check if cached data exists and is still valid
 */
export function isCacheValid(accountNo: string): boolean {
  try {
    // First check if daily reset should be performed
    if (shouldPerformDailyReset()) {
      performDailyReset();
      return false; // Cache is invalid after reset
    }

    const cacheKey = CACHE_KEY_PREFIX + accountNo;
    const metadataKey = CACHE_METADATA_KEY + accountNo;

    const cachedData = localStorage.getItem(cacheKey);
    const metadata = localStorage.getItem(metadataKey);

    if (!cachedData || !metadata) {
      return false;
    }

    const parsedMetadata: CacheMetadata = JSON.parse(metadata);
    const now = Date.now();

    // Check if cache has exceeded 12-hour maximum lifetime
    if (now - parsedMetadata.lastFetch > CACHE_DURATION_MS) {
      console.log('AI cache expired due to 12-hour limit for account:', accountNo);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error checking AI cache validity:', error);
    return false;
  }
}

/**
 * Get cached AI response if valid
 */
export function getCachedAiResponse(
  accountNo: string,
  monthlyConsumption: MonthlyConsumption[],
  rechargeHistory: RechargeHistoryItem[],
  balanceData: BalanceData | null,
  dailyConsumption: DailyConsumption[]
): AiSummary | null {
  try {
    // First check if daily reset should be performed
    if (shouldPerformDailyReset()) {
      performDailyReset();
      return null; // No cache available after reset
    }

    const cacheKey = CACHE_KEY_PREFIX + accountNo;
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed: CachedAiResponse = JSON.parse(cachedData);

    // Check if data has changed significantly
    const currentDataHash = generateDataHash(monthlyConsumption, rechargeHistory, balanceData, dailyConsumption);
    if (parsed.dataHash !== currentDataHash) {
      console.log('AI cache invalidated due to data changes for account:', accountNo);
      clearCache(accountNo);
      return null;
    }

    // Check if cache is still valid (12-hour limit)
    if (!isCacheValid(accountNo)) {
      clearCache(accountNo);
      return null;
    }

    console.log('Using cached AI insights for account:', accountNo);
    return parsed.data;
  } catch (error) {
    console.warn('Error retrieving cached AI response:', error);
    clearCache(accountNo);
    return null;
  }
}

/**
 * Cache AI response
 */
export function cacheAiResponse(
  accountNo: string,
  aiResponse: AiSummary,
  monthlyConsumption: MonthlyConsumption[],
  rechargeHistory: RechargeHistoryItem[],
  balanceData: BalanceData | null,
  dailyConsumption: DailyConsumption[]
): void {
  try {
    const cacheKey = CACHE_KEY_PREFIX + accountNo;
    const metadataKey = CACHE_METADATA_KEY + accountNo;
    const now = Date.now();
    
    const dataHash = generateDataHash(monthlyConsumption, rechargeHistory, balanceData, dailyConsumption);
    
    const cacheData: CachedAiResponse = {
      data: aiResponse,
      timestamp: now,
      accountNo,
      dataHash
    };
    
    const metadata: CacheMetadata = {
      lastFetch: now,
      accountNo,
      isStale: false
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    localStorage.setItem(metadataKey, JSON.stringify(metadata));
    

  } catch (error) {
    console.warn('Error caching AI response:', error);
  }
}

/**
 * Clear cache for specific account
 */
export function clearCache(accountNo: string): void {
  try {
    const cacheKey = CACHE_KEY_PREFIX + accountNo;
    const metadataKey = CACHE_METADATA_KEY + accountNo;
    
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(metadataKey);
    
    console.log('AI cache cleared for account:', accountNo);
  } catch (error) {
    console.warn('Error clearing AI cache:', error);
  }
}

/**
 * Clear all AI caches
 */
export function clearAllCaches(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX) ||
          key.startsWith(CACHE_METADATA_KEY) ||
          key.startsWith(DAILY_RESET_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('All AI caches cleared');
  } catch (error) {
    console.warn('Error clearing all AI caches:', error);
  }
}

/**
 * Get cache status for UI display
 */
export function getCacheStatus(accountNo: string): {
  isCached: boolean;
  isStale: boolean;
  lastFetch: Date | null;
  timeRemaining: number; // minutes
  nextDailyReset: Date; // when the next daily reset will occur
} {
  try {
    const metadataKey = CACHE_METADATA_KEY + accountNo;
    const metadata = localStorage.getItem(metadataKey);

    const nextResetTime = getNextDailyResetTime();

    if (!metadata) {
      return {
        isCached: false,
        isStale: false,
        lastFetch: null,
        timeRemaining: 0,
        nextDailyReset: new Date(nextResetTime)
      };
    }

    const parsed: CacheMetadata = JSON.parse(metadata);
    const now = Date.now();
    const elapsed = now - parsed.lastFetch;
    const remaining = Math.max(0, CACHE_DURATION_MS - elapsed);

    // Check if daily reset should happen before 12-hour expiry
    const timeUntilDailyReset = nextResetTime - now;
    const effectiveTimeRemaining = Math.min(remaining, Math.max(0, timeUntilDailyReset));

    return {
      isCached: true,
      isStale: elapsed > CACHE_DURATION_MS || shouldPerformDailyReset(),
      lastFetch: new Date(parsed.lastFetch),
      timeRemaining: Math.ceil(effectiveTimeRemaining / (60 * 1000)), // Convert to minutes
      nextDailyReset: new Date(nextResetTime)
    };
  } catch (error) {
    console.warn('Error getting cache status:', error);
    return {
      isCached: false,
      isStale: false,
      lastFetch: null,
      timeRemaining: 0,
      nextDailyReset: new Date(getNextDailyResetTime())
    };
  }
}

/**
 * Force refresh - clears cache and indicates fresh fetch needed
 */
export function forceRefresh(accountNo: string): void {
  clearCache(accountNo);
  console.log('Forced refresh initiated for account:', accountNo);
}
