/**
 * Authentication Flow Integration Tests
 * Tests the complete authentication flow including:
 * - Login with valid/invalid credentials
 * - Session persistence
 * - Logout
 * - Protected route access
 */

import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from '../../src/renderer/contexts/AuthContext';
import Login from '../../src/renderer/pages/Login';
import { mockElectronAPI } from '../setupTests';

const theme = createTheme();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render with auth provider
const renderWithAuth = (ui: React.ReactElement) => {
  return rtlRender(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Test component to access auth context
const AuthTestConsumer: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-info">
        {user ? `${user.username} (${user.role})` : 'Not logged in'}
      </div>
      <button data-testid="login-btn" onClick={() => login('admin', 'password')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      renderWithAuth(<AuthTestConsumer />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });

      // Click login button
      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      // Verify user is logged in
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('admin (Admin)');
      });

      // Verify session is stored
      const session = sessionStorage.getItem('clinic-session');
      expect(session).not.toBeNull();
    });

    it('should fail login with invalid credentials', async () => {
      mockElectronAPI.database.execute.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderWithAuth(<AuthTestConsumer />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });

      // Click login button
      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      // Verify user is still not logged in
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');

      // Verify no session is stored
      expect(sessionStorage.getItem('clinic-session')).toBeNull();
    });

    it('should login through login page and navigate to dashboard', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      // Render login page with auth provider
      renderWithAuth(<Login />);

      // Fill in credentials
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Verify navigation to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should show error message on login failure', async () => {
      mockElectronAPI.database.execute.mockResolvedValue({
        success: false,
        error: 'Invalid username or password',
      });

      renderWithAuth(<Login />);

      // Fill in credentials
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'wrongpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should logout and clear session', async () => {
      const mockUser = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      renderWithAuth(<AuthTestConsumer />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });

      // Login first
      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('admin (Admin)');
      });

      // Verify session exists
      expect(sessionStorage.getItem('clinic-session')).not.toBeNull();

      // Logout
      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      // Verify user is logged out
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');

      // Verify session is cleared
      expect(sessionStorage.getItem('clinic-session')).toBeNull();
    });
  });

  describe('Session Persistence', () => {
    it('should restore session on page reload', async () => {
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

      renderWithAuth(<AuthTestConsumer />);

      // Should be logged in from session
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('admin (Admin)');
      });
    });

    it('should clear expired session on page load', async () => {
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

      renderWithAuth(<AuthTestConsumer />);

      // Should not be logged in due to expired session
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
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

      renderWithAuth(<AuthTestConsumer />);

      // Should not be logged in due to max age exceeded
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });
    });
  });

  describe('User Roles', () => {
    it('should correctly identify Admin users', async () => {
      const mockAdmin = {
        userID: 1,
        username: 'admin',
        role: 'Admin' as const,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: mockAdmin,
      });

      renderWithAuth(<AuthTestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('admin (Admin)');
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

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      renderWithAuth(<AuthTestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('staff (User)');
      });
    });
  });

  describe('Login Form Validation', () => {
    it('should prevent login with empty username', async () => {
      renderWithAuth(<Login />);

      // Fill in only password
      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      });

      // API should not be called
      expect(mockElectronAPI.database.execute).not.toHaveBeenCalled();
    });

    it('should prevent login with empty password', async () => {
      renderWithAuth(<Login />);

      // Fill in only username
      const usernameInput = screen.getByLabelText(/username/i);
      await userEvent.type(usernameInput, 'admin');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      });

      // API should not be called
      expect(mockElectronAPI.database.execute).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockElectronAPI.database.execute.mockRejectedValue(new Error('Network error'));

      renderWithAuth(<Login />);

      // Fill in credentials
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Verify error message - AuthContext catches and returns friendly error
      await waitFor(() => {
        expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
      });
    });
  });
});
