import { useState, useCallback } from 'react';
import { useTrialStatus } from './useTrialStatus';

export const useValuePropModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { daysRemaining } = useTrialStatus();

  const showValueProp = useCallback((trigger: 'leaderboard' | 'profile' | 'social') => {
    // Store the trigger point in localStorage to avoid showing it again for the same trigger
    const key = `valuePropShown_${trigger}`;
    const hasShown = localStorage.getItem(key);
    
    if (!hasShown) {
      setIsOpen(true);
      localStorage.setItem(key, 'true');
    }
  }, []);

  const closeValueProp = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    showValueProp,
    closeValueProp,
    daysRemaining
  };
}; 