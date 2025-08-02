// Secure API key storage utilities for standard deployment
import { getDeploymentConfig } from './deploymentConfig';

const API_KEY_STORAGE_KEY = 'desco_user_api_key';
const API_KEY_VALIDATION_KEY = 'desco_api_key_validated';

/**
 * Simple encryption/decryption using base64 encoding with a salt
 * Note: This is basic obfuscation, not cryptographically secure
 * For production, consider using Web Crypto API or server-side encryption
 */
class SimpleEncryption {
  private static readonly SALT = 'DescoWise2024';

  static encrypt(text: string): string {
    try {
      const combined = this.SALT + text + this.SALT;
      return btoa(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Fallback to plain text
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText);
      const saltLength = this.SALT.length;
      return decoded.slice(saltLength, -saltLength);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Fallback to treating as plain text
    }
  }
}

/**
 * Store user's API key securely in localStorage
 */
export function storeUserApiKey(apiKey: string): boolean {
  try {
    const config = getDeploymentConfig();
    if (config.isPremium) {
      console.warn('API key storage not needed for premium deployment');
      return false;
    }

    if (!apiKey || apiKey.trim() === '') {
      removeUserApiKey();
      return true;
    }

    const encrypted = SimpleEncryption.encrypt(apiKey.trim());
    localStorage.setItem(API_KEY_STORAGE_KEY, encrypted);
    return true;
  } catch (error) {
    console.error('Failed to store API key:', error);
    return false;
  }
}

/**
 * Retrieve user's API key from localStorage
 */
export function getUserApiKey(): string | null {
  try {
    const config = getDeploymentConfig();
    if (config.isPremium) {
      return null; // Premium deployment doesn't use user API keys
    }

    const encrypted = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encrypted) {
      return null;
    }

    return SimpleEncryption.decrypt(encrypted);
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    return null;
  }
}

/**
 * Remove user's API key from localStorage
 */
export function removeUserApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(API_KEY_VALIDATION_KEY);
  } catch (error) {
    console.error('Failed to remove API key:', error);
  }
}

/**
 * Check if user has stored an API key
 */
export function hasUserApiKey(): boolean {
  const apiKey = getUserApiKey();
  return !!(apiKey && apiKey.trim() !== '');
}

/**
 * Store API key validation status
 */
export function setApiKeyValidationStatus(isValid: boolean): void {
  try {
    localStorage.setItem(API_KEY_VALIDATION_KEY, JSON.stringify({
      isValid,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to store validation status:', error);
  }
}

/**
 * Get API key validation status (with expiry check)
 */
export function getApiKeyValidationStatus(): { isValid: boolean; isExpired: boolean } | null {
  try {
    const stored = localStorage.getItem(API_KEY_VALIDATION_KEY);
    if (!stored) {
      return null;
    }

    const { isValid, timestamp } = JSON.parse(stored);
    const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000; // 24 hours

    return { isValid, isExpired };
  } catch (error) {
    console.error('Failed to get validation status:', error);
    return null;
  }
}

/**
 * Clear validation status (force re-validation)
 */
export function clearApiKeyValidationStatus(): void {
  try {
    localStorage.removeItem(API_KEY_VALIDATION_KEY);
  } catch (error) {
    console.error('Failed to clear validation status:', error);
  }
}

/**
 * Get API key display format (masked for security)
 */
export function getApiKeyDisplayFormat(apiKey?: string): string {
  const key = apiKey || getUserApiKey();
  if (!key || key.length < 8) {
    return 'Not configured';
  }
  
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * Validate API key format (basic check)
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  const trimmed = apiKey.trim();
  // Basic validation: should be at least 20 characters and contain alphanumeric characters
  return trimmed.length >= 20 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}
