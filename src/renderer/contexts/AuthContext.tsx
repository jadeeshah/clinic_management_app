import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'clinic-session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_AGE = 12 * 60 * 60 * 1000; // 12 hours

interface StoredSession {
  user: User;
  loginTime: number;
  lastActivity: number;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Activity tracking for session timeout
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const session: StoredSession = JSON.parse(atob(sessionData));
          session.lastActivity = Date.now();
          sessionStorage.setItem(SESSION_KEY, btoa(JSON.stringify(session)));
        } catch {
          // Ignore errors
        }
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Check session validity periodically
    const checkInterval = setInterval(() => {
      if (!isSessionValid()) {
        logout();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(checkInterval);
    };
  }, [user]);

  const isSessionValid = (): boolean => {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) return false;

    try {
      const session: StoredSession = JSON.parse(atob(sessionData));
      const now = Date.now();

      // Check inactivity timeout
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        return false;
      }

      // Check max session age
      if (now - session.loginTime > MAX_SESSION_AGE) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const loadSession = () => {
    try {
      if (isSessionValid()) {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const session: StoredSession = JSON.parse(atob(sessionData));
          setUser(session.user);
        }
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await window.electronAPI.database.execute<User>('validate-user', {
        username,
        password,
      });

      if (result.success && result.data) {
        const session: StoredSession = {
          user: result.data,
          loginTime: Date.now(),
          lastActivity: Date.now(),
        };
        sessionStorage.setItem(SESSION_KEY, btoa(JSON.stringify(session)));
        setUser(result.data);
        return { success: true };
      }

      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
