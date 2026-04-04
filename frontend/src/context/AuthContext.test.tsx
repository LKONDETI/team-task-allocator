import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { login as apiLogin, me } from '../api/auth';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the API layer — no real HTTP calls
vi.mock('../api/auth');
const mockApiLogin = apiLogin as Mock;
const mockMe = me as Mock;

const ALICE: import('../types/user').AuthUser = {
  userId: '2',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'employee',
};

// Wrap the hook in AuthProvider for every test
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Replace window.location so logout's href assignment doesn't throw in jsdom
  vi.stubGlobal('location', { href: '' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Page-load rehydration
// ---------------------------------------------------------------------------

describe('AuthContext — page load with no token', () => {
  it('does not call me() and sets isLoading to false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockMe).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});

describe('AuthContext — page load with a valid token', () => {
  it('calls me() and sets the user', async () => {
    localStorage.setItem('token', 'valid-jwt');
    mockMe.mockResolvedValue(ALICE);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockMe).toHaveBeenCalledOnce();
    expect(result.current.user).toEqual(ALICE);
  });
});

describe('AuthContext — page load with an expired / invalid token', () => {
  it('removes the token from localStorage when me() rejects', async () => {
    localStorage.setItem('token', 'expired-jwt');
    mockMe.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// login()
// ---------------------------------------------------------------------------

describe('AuthContext — login()', () => {
  it('stores the token, sets the user, and returns the profile', async () => {
    mockApiLogin.mockResolvedValue({ token: 'new-jwt' });
    mockMe.mockResolvedValue(ALICE);
    // Suppress the initial rehydration call (no token in localStorage yet)

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let returnedProfile: import('../types/user').AuthUser | undefined;
    await act(async () => {
      returnedProfile = await result.current.login('alice@example.com', 'secret');
    });

    expect(localStorage.getItem('token')).toBe('new-jwt');
    expect(result.current.user).toEqual(ALICE);
    expect(returnedProfile).toEqual(ALICE);
  });
});

// ---------------------------------------------------------------------------
// logout()
// ---------------------------------------------------------------------------

describe('AuthContext — logout()', () => {
  it('clears the token, nulls the user, and redirects to /', async () => {
    localStorage.setItem('token', 'valid-jwt');
    mockMe.mockResolvedValue(ALICE);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(ALICE));

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(window.location.href).toBe('/');
  });
});
