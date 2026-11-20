export const shouldOpenAiSetupModal = (aiInsightsEnabled: boolean, hasApiKey: boolean): boolean =>
    !aiInsightsEnabled && !hasApiKey;
