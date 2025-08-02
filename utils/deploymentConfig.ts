// Deployment configuration utilities

export interface DeploymentConfig {
  requiresUserApiKey: boolean;
  showApiKeySetup: boolean;
}

/**
 * Get the current deployment configuration
 * DescoWise uses a single deployment strategy where users provide their own API keys
 */
export function getDeploymentConfig(): DeploymentConfig {
  return {
    requiresUserApiKey: true,
    showApiKeySetup: true
  };
}

/**
 * Check if AI features should be available based on user-provided API key
 */
export function shouldEnableAiFeatures(userApiKey?: string): boolean {
  // AI features available if user provided API key
  return !!(userApiKey && userApiKey.trim() !== '');
}

/**
 * Get the API key to use for AI requests
 */
export function getApiKeyForRequest(userApiKey?: string): string | null {
  // Use user-provided API key
  return userApiKey || null;
}

/**
 * Get user-friendly deployment information for UI display
 */
export function getDeploymentInfo(): {
  title: string;
  description: string;
  aiFeatureStatus: 'enabled' | 'requires_setup' | 'unavailable';
} {
  return {
    title: 'DescoWise',
    description: 'Smart electricity management for DESCO customers',
    aiFeatureStatus: 'requires_setup'
  };
}
