import type { User } from '../types';

const AUTH_KEY = 'auth_user';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store user and tokens in localStorage
 */
export const setAuthUser = (user: User, accessToken: string, refreshToken: string): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Get user from localStorage
 */
export const getAuthUser = (): User | null => {
  const userStr = localStorage.getItem(AUTH_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Update tokens in localStorage
 */
export const updateTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Remove user and tokens from localStorage (logout)
 */
export const removeAuthUser = (): void => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

