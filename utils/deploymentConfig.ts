// Deployment configuration utilities
export type DeploymentType = 'premium' | 'standard';

export interface DeploymentConfig {
  type: DeploymentType;
  isPremium: boolean;
  hasPreConfiguredApiKey: boolean;
  requiresUserApiKey: boolean;
  showApiKeySetup: boolean;
}

/**
 * Get the current deployment configuration
 */
export function getDeploymentConfig(): DeploymentConfig {
  const deploymentType = (process.env.DEPLOYMENT_TYPE || 'standard') as DeploymentType;
  const isPremium = deploymentType === 'premium';
  
  return {
    type: deploymentType,
    isPremium,
    hasPreConfiguredApiKey: isPremium && !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    requiresUserApiKey: !isPremium,
    showApiKeySetup: !isPremium
  };
}

/**
 * Check if AI features should be available based on deployment and API key status
 */
export function shouldEnableAiFeatures(userApiKey?: string): boolean {
  const config = getDeploymentConfig();
  
  if (config.isPremium) {
    // Premium deployment: AI features available if pre-configured API key exists
    return config.hasPreConfiguredApiKey;
  } else {
    // Standard deployment: AI features available if user provided API key
    return !!(userApiKey && userApiKey.trim() !== '');
  }
}

/**
 * Get the API key to use for AI requests
 */
export function getApiKeyForRequest(userApiKey?: string): string | null {
  const config = getDeploymentConfig();
  
  if (config.isPremium && config.hasPreConfiguredApiKey) {
    // Premium deployment: use pre-configured API key
    return process.env.GEMINI_API_KEY || process.env.API_KEY || null;
  } else if (!config.isPremium && userApiKey) {
    // Standard deployment: use user-provided API key
    return userApiKey;
  }
  
  return null;
}

/**
 * Get user-friendly deployment information for UI display
 */
export function getDeploymentInfo(): {
  title: string;
  description: string;
  aiFeatureStatus: 'enabled' | 'requires_setup' | 'unavailable';
} {
  const config = getDeploymentConfig();
  
  if (config.isPremium) {
    return {
      title: 'DescoWise Premium',
      description: 'AI insights powered by premium API access',
      aiFeatureStatus: config.hasPreConfiguredApiKey ? 'enabled' : 'unavailable'
    };
  } else {
    return {
      title: 'DescoWise',
      description: 'Smart electricity management for DESCO customers',
      aiFeatureStatus: 'requires_setup'
    };
  }
}
