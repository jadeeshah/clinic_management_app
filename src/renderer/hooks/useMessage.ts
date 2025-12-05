import { useState, useCallback } from 'react';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface Message {
  type: MessageType;
  text: string;
}

export interface UseMessageReturn {
  /** Current message (null if none) */
  message: Message | null;
  /** Show a success message */
  showSuccess: (text: string) => void;
  /** Show an error message */
  showError: (text: string) => void;
  /** Show a warning message */
  showWarning: (text: string) => void;
  /** Show an info message */
  showInfo: (text: string) => void;
  /** Clear the current message */
  clearMessage: () => void;
}

/**
 * Custom hook for managing user feedback messages
 * Provides consistent message handling across components
 */
export const useMessage = (): UseMessageReturn => {
  const [message, setMessage] = useState<Message | null>(null);

  const showSuccess = useCallback((text: string) => {
    setMessage({ type: 'success', text });
  }, []);

  const showError = useCallback((text: string) => {
    setMessage({ type: 'error', text });
  }, []);

  const showWarning = useCallback((text: string) => {
    setMessage({ type: 'warning', text });
  }, []);

  const showInfo = useCallback((text: string) => {
    setMessage({ type: 'info', text });
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearMessage,
  };
};

export default useMessage;
