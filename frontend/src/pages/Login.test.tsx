import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

// Mock AuthContext — we control what `login` returns per test
vi.mock('../context/AuthContext');
const mockUseAuth = useAuth as Mock;

// Mock react-router-dom — we only need to spy on navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ login: vi.fn() });
});

describe('Login — rendering', () => {
  it('renders the email input, password input, and sign in button', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('Login — show/hide password', () => {
  it('password input is hidden by default', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when the show button is clicked', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    const toggleBtn = screen.getByRole('button', { name: 'Show password' });

    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('Login — successful sign in', () => {
  it('navigates to /manager when the user has role manager', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({ role: 'manager' });
    mockUseAuth.mockReturnValue({ login: mockLogin });

    render(<Login />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bob@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/manager'));
  });

  it('navigates to /employee when the user has role employee', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({ role: 'employee' });
    mockUseAuth.mockReturnValue({ login: mockLogin });

    render(<Login />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'alice@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/employee'));
  });
});

describe('Login — failed sign in', () => {
  it('shows an error message when login rejects', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockRejectedValue(new Error('Unauthorized'));
    mockUseAuth.mockReturnValue({ login: mockLogin });

    render(<Login />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('clears a previous error when the form is submitted again', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn()
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce({ role: 'manager' });
    mockUseAuth.mockReturnValue({ login: mockLogin });

    render(<Login />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bob@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');

    // First submit — should show error
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();

    // Second submit — error should be cleared before the call resolves
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(screen.queryByText('Invalid email or password.')).not.toBeInTheDocument()
    );
  });
});

describe('Login — submitting state', () => {
  it('disables the button and shows "Signing in…" while the request is in flight', async () => {
    const user = userEvent.setup();
    // Never resolves — keeps the component in the submitting state
    const mockLogin = vi.fn().mockReturnValue(new Promise(() => {}));
    mockUseAuth.mockReturnValue({ login: mockLogin });

    render(<Login />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bob@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const btn = screen.getByRole('button', { name: 'Signing in…' });
    expect(btn).toBeDisabled();
  });
});
