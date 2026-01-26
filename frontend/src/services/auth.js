// Auth Service - Login/logout/register, token storage, auth state management

import { authApi } from './api.js';

const TOKEN_KEY = 'voicecircle_token';
const USER_KEY = 'voicecircle_user';

// Simple pub/sub for auth state changes
const listeners = new Set();

export const authState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function updateAuthState(updates) {
  Object.assign(authState, updates);
  listeners.forEach(listener => listener(authState));
}

export function onAuthChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export async function initAuth() {
  const token = getToken();
  const storedUser = getStoredUser();

  if (!token) {
    updateAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    return;
  }

  // Try to get current user from API
  try {
    const { user } = await authApi.getMe();
    setStoredUser(user);
    updateAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  } catch (error) {
    // Token might be invalid, clear everything
    if (error.status === 401) {
      setToken(null);
      setStoredUser(null);
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } else {
      // Network error - use stored user if available
      if (storedUser) {
        updateAuthState({
          user: storedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        updateAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }
  }
}

export async function login(email, password) {
  const { user, token } = await authApi.login({ email, password });
  setToken(token);
  setStoredUser(user);
  updateAuthState({
    user,
    token,
    isAuthenticated: true,
    isLoading: false,
  });
  return { user, token };
}

export async function register(data) {
  const { user, token } = await authApi.register(data);
  setToken(token);
  setStoredUser(user);
  updateAuthState({
    user,
    token,
    isAuthenticated: true,
    isLoading: false,
  });
  return { user, token };
}

export async function logout() {
  try {
    await authApi.logout();
  } catch (error) {
    // Ignore errors on logout
  }
  setToken(null);
  setStoredUser(null);
  updateAuthState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

export function updateCurrentUser(updates) {
  const user = { ...authState.user, ...updates };
  setStoredUser(user);
  updateAuthState({ user });
}
