/**
 * Login Component Tests
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithoutAuth } from '../../utils/testUtils';
import Login from '../../../src/renderer/pages/Login';
import { mockElectronAPI } from '../../setupTests';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockLogin = jest.fn();
jest.mock('../../../src/renderer/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      renderWithoutAuth(<Login />);

      expect(screen.getByText('Clinic Manager')).toBeInTheDocument();
      expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render password visibility toggle', () => {
      renderWithoutAuth(<Login />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    it('should update username field on input', async () => {
      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      await userEvent.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('should update password field on input', async () => {
      renderWithoutAuth(<Login />);

      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'testpass');

      expect(passwordInput).toHaveValue('testpass');
    });

    it('should toggle password visibility', async () => {
      renderWithoutAuth(<Login />);

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      let toggleButton = screen.getByRole('button', { name: /show password/i });
      await userEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      toggleButton = screen.getByRole('button', { name: /hide password/i });
      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should show error when username is empty', async () => {
      renderWithoutAuth(<Login />);

      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'testpass');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      await userEvent.type(usernameInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when both fields are empty', async () => {
      renderWithoutAuth(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only input', async () => {
      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, '   ');
      await userEvent.type(passwordInput, '   ');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call login with credentials on valid submit', async () => {
      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
      });
    });

    it('should navigate to home on successful login', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });

      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should show error message on failed login', async () => {
      mockLogin.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });

      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show default error message when no error provided', async () => {
      mockLogin.mockResolvedValueOnce({ success: false });

      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('should handle unexpected errors', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable button while loading', async () => {
      mockLogin.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show loading indicator while submitting', async () => {
      mockLogin.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission via Enter Key', () => {
    it('should submit form when pressing Enter in password field', async () => {
      renderWithoutAuth(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(passwordInput, 'password123{enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
      });
    });
  });
});
