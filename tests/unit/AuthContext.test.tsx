/**
 * AuthContext Tests
 * Tests authentication functionality including login, logout, and session management
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../src/renderer/contexts/AuthContext';
import { mockElectronAPI } from '../setupTests';

// Test component that uses auth context
const TestAuthConsumer: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.username}` : 'Not logged in'}
      </div>
      <div data-testid="user-role">{user?.role || 'No role'}</div>
      <button onClick={() => login('testuser', 'testpass')} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should start with no user logged in', async () => {
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });

    it('should show loading state initially', () => {
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // May see loading briefly
      expect(screen.queryByText('Loading...') || screen.queryByTestId('user-status')).toBeInTheDocument();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestAuthConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as admin');
      });

      expect(mockElectronAPI.database.execute).toHaveBeenCalledWith('validate-user', {
        username: 'testuser',
        password: 'testpass',
      });
    });

    it('should fail login with invalid credentials', async () => {
      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      // Should still not be logged in
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    it('should handle login error gracefully', async () => {
      mockElectronAPI.database.execute.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      // Should still not be logged in after error
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Login first
      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as admin');
      });

      // Then logout
      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });

    it('should clear session storage on logout', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(sessionStorage.getItem('clinic-session')).not.toBeNull();
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(sessionStorage.getItem('clinic-session')).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should store session data after login', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        const storedSession = sessionStorage.getItem('clinic-session');
        expect(storedSession).not.toBeNull();

        if (storedSession) {
          const decoded = JSON.parse(atob(storedSession));
          expect(decoded.user.username).toBe('admin');
          expect(decoded.loginTime).toBeDefined();
          expect(decoded.lastActivity).toBeDefined();
        }
      });
    });

    it('should restore session on mount if valid', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Pre-set a valid session
      const session = {
        user: mockUser,
        loginTime: Date.now(),
        lastActivity: Date.now(),
      };
      sessionStorage.setItem('clinic-session', btoa(JSON.stringify(session)));

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as admin');
      });
    });

    it('should clear expired session on mount', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Pre-set an expired session (inactive for more than 30 minutes)
      const session = {
        user: mockUser,
        loginTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        lastActivity: Date.now() - 31 * 60 * 1000, // 31 minutes ago
      };
      sessionStorage.setItem('clinic-session', btoa(JSON.stringify(session)));

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });

      // Session should be cleared
      expect(sessionStorage.getItem('clinic-session')).toBeNull();
    });

    it('should clear session that exceeds max age', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Pre-set a session that exceeds max age (12 hours)
      const session = {
        user: mockUser,
        loginTime: Date.now() - 13 * 60 * 60 * 1000, // 13 hours ago
        lastActivity: Date.now() - 1000, // Recent activity
      };
      sessionStorage.setItem('clinic-session', btoa(JSON.stringify(session)));

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });
    });
  });

  describe('User Roles', () => {
    it('should correctly identify Admin users', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('Admin');
      });
    });

    it('should correctly identify regular users', async () => {
      const mockUser = {
        userID: 2,
        username: 'staff',
        role: 'User' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValueOnce({
        success: true,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('User');
      });
    });
  });
});
