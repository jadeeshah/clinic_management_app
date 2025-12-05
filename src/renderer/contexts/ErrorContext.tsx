import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
}

interface ErrorContextType {
  /** Show an error notification */
  showError: (message: string) => void;
  /** Show a success notification */
  showSuccess: (message: string) => void;
  /** Show a warning notification */
  showWarning: (message: string) => void;
  /** Show an info notification */
  showInfo: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

let notificationId = 0;

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * ErrorProvider component that provides global notification capabilities
 * Wrap your App component with this to enable showError/showSuccess anywhere
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, severity: AlertColor) => {
    const id = ++notificationId;
    setNotifications(prev => [...prev, { id, message, severity }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showError = useCallback((message: string) => {
    addNotification(message, 'error');
  }, [addNotification]);

  const showSuccess = useCallback((message: string) => {
    addNotification(message, 'success');
  }, [addNotification]);

  const showWarning = useCallback((message: string) => {
    addNotification(message, 'warning');
  }, [addNotification]);

  const showInfo = useCallback((message: string) => {
    addNotification(message, 'info');
  }, [addNotification]);

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showWarning, showInfo }}>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.severity === 'error' ? 6000 : 4000}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            // Stack notifications
            bottom: `${24 + (notifications.indexOf(notification) * 60)}px !important`,
          }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </ErrorContext.Provider>
  );
};

/**
 * Hook to access global notification functions
 * Must be used within an ErrorProvider
 */
export const useNotification = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useNotification must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
