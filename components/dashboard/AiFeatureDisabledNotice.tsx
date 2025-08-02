import React, { useState, useEffect } from 'react';
import { hasStoredApiKey } from '../../utils/apiKeyStorage';
import ApiKeyPrompt from '../common/ApiKeyPrompt';

interface AiFeatureDisabledNoticeProps {
  onSetupApiKey?: () => void;
}

const AiFeatureDisabledNotice: React.FC<AiFeatureDisabledNoticeProps> = ({ onSetupApiKey }) => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Use synchronous check for quick UI updates
    setHasApiKey(hasStoredApiKey());
  }, []);

  // Don't show notice if user has already configured API key
  if (hasApiKey) {
    return null;
  }

  // Use the new ApiKeyPrompt component for better consistency
  return (
    <ApiKeyPrompt
      variant="banner"
      onSetupClick={onSetupApiKey || (() => {})}
      showDismiss={false}
    />
  );
};

export default AiFeatureDisabledNotice;
