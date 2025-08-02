// Secure API key storage utilities

const API_KEY_STORAGE_KEY = 'desco_user_api_key';
const API_KEY_VALIDATION_KEY = 'desco_api_key_validated';

/**
 * Secure encryption/decryption using Web Crypto API with AES-GCM
 * Falls back to base64 obfuscation if Web Crypto API is not available
 */
class SecureEncryption {
  private static readonly SALT = 'DescoWise2024';
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate a cryptographic key from a password using PBKDF2
   */
  private static async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a deterministic salt from the static salt
   */
  private static generateSalt(): Uint8Array {
    const encoder = new TextEncoder();
    const saltData = encoder.encode(this.SALT);
    // Pad or truncate to 16 bytes
    const salt = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      salt[i] = saltData[i % saltData.length];
    }
    return salt;
  }

  /**
   * Encrypt text using AES-GCM
   */
  static async encrypt(text: string): Promise<string> {
    try {
      // Check if Web Crypto API is available
      if (!crypto.subtle) {
        return this.fallbackEncrypt(text);
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const salt = this.generateSalt();
      const key = await this.generateKey(this.SALT, salt);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed, falling back to simple obfuscation:', error);
      return this.fallbackEncrypt(text);
    }
  }

  /**
   * Decrypt text using AES-GCM
   */
  static async decrypt(encryptedText: string): Promise<string> {
    try {
      // Check if Web Crypto API is available
      if (!crypto.subtle) {
        return this.fallbackDecrypt(encryptedText);
      }

      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const encrypted = combined.slice(this.IV_LENGTH);

      const salt = this.generateSalt();
      const key = await this.generateKey(this.SALT, salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed, trying fallback method:', error);
      return this.fallbackDecrypt(encryptedText);
    }
  }

  /**
   * Fallback encryption using base64 obfuscation
   */
  private static fallbackEncrypt(text: string): string {
    try {
      const combined = this.SALT + text + this.SALT;
      return btoa(combined);
    } catch (error) {
      console.error('Fallback encryption failed:', error);
      return text; // Last resort fallback
    }
  }

  /**
   * Fallback decryption using base64 obfuscation
   */
  private static fallbackDecrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText);
      const saltLength = this.SALT.length;
      return decoded.slice(saltLength, -saltLength);
    } catch (error) {
      console.error('Fallback decryption failed:', error);
      return encryptedText; // Last resort fallback
    }
  }
}

/**
 * Store user's API key securely in localStorage
 */
export async function storeUserApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.trim() === '') {
      removeUserApiKey();
      return true;
    }

    const encrypted = await SecureEncryption.encrypt(apiKey.trim());
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
export async function getUserApiKey(): Promise<string | null> {
  try {
    const encrypted = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encrypted) {
      return null;
    }

    return await SecureEncryption.decrypt(encrypted);
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
export async function hasUserApiKey(): Promise<boolean> {
  const apiKey = await getUserApiKey();
  return !!(apiKey && apiKey.trim() !== '');
}

/**
 * Synchronous check if user has stored an API key (checks only if encrypted data exists)
 * Use this for quick checks where you don't need the actual key value
 */
export function hasStoredApiKey(): boolean {
  const encrypted = localStorage.getItem(API_KEY_STORAGE_KEY);
  return !!(encrypted && encrypted.trim() !== '');
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
export async function getApiKeyDisplayFormat(apiKey?: string): Promise<string> {
  const key = apiKey || await getUserApiKey();
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
