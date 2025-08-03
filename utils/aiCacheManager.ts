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
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_KEY_PREFIX = 'ai_cache_';
const CACHE_METADATA_KEY = 'ai_cache_metadata_';

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
    const cacheKey = CACHE_KEY_PREFIX + accountNo;
    const metadataKey = CACHE_METADATA_KEY + accountNo;
    
    const cachedData = localStorage.getItem(cacheKey);
    const metadata = localStorage.getItem(metadataKey);
    
    if (!cachedData || !metadata) {
      return false;
    }
    
    const parsedMetadata: CacheMetadata = JSON.parse(metadata);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - parsedMetadata.lastFetch > CACHE_DURATION_MS) {
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
    const cacheKey = CACHE_KEY_PREFIX + accountNo;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    const parsed: CachedAiResponse = JSON.parse(cachedData);
    
    // Check if data has changed significantly
    const currentDataHash = generateDataHash(monthlyConsumption, rechargeHistory, balanceData, dailyConsumption);
    if (parsed.dataHash !== currentDataHash) {
      console.log('AI cache invalidated due to data changes');
      clearCache(accountNo);
      return null;
    }
    
    // Check if cache is still valid
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
      if (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_METADATA_KEY)) {
        localStorage.removeItem(key);
      }
    });

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
} {
  try {
    const metadataKey = CACHE_METADATA_KEY + accountNo;
    const metadata = localStorage.getItem(metadataKey);
    
    if (!metadata) {
      return {
        isCached: false,
        isStale: false,
        lastFetch: null,
        timeRemaining: 0
      };
    }
    
    const parsed: CacheMetadata = JSON.parse(metadata);
    const now = Date.now();
    const elapsed = now - parsed.lastFetch;
    const remaining = Math.max(0, CACHE_DURATION_MS - elapsed);
    
    return {
      isCached: true,
      isStale: elapsed > CACHE_DURATION_MS,
      lastFetch: new Date(parsed.lastFetch),
      timeRemaining: Math.ceil(remaining / (60 * 1000)) // Convert to minutes
    };
  } catch (error) {
    console.warn('Error getting cache status:', error);
    return {
      isCached: false,
      isStale: false,
      lastFetch: null,
      timeRemaining: 0
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
