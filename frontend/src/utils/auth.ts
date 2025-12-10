import type { User } from '../types';

const AUTH_KEY = 'auth_user';

/**
 * Store user in localStorage
 */
export const setAuthUser = (user: User): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
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
 * Remove user from localStorage (logout)
 */
export const removeAuthUser = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

