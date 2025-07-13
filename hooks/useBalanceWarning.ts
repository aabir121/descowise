import { useState, useEffect } from 'react';
import { balanceWarningService } from '../services/balanceWarningService';

export const useBalanceWarning = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = balanceWarningService.subscribe(setIsOpen);
    return unsubscribe;
  }, []);

  const open = () => balanceWarningService.open();
  const close = () => balanceWarningService.close();

  return { isOpen, open, close };
}; 