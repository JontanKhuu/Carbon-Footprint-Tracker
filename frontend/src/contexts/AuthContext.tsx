import { createContext, useState, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { getAuthUser, setAuthUser, removeAuthUser, getAccessToken } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage
  const [user, setUser] = useState<User | null>(() => getAuthUser());
  const navigate = useNavigate();

  // Calculate isAuthenticated from localStorage and user state
  // Always check localStorage first as source of truth for immediate updates
  const isAuthenticated = useMemo(() => {
    const token = getAccessToken();
    const storedUser = getAuthUser();
    // Always use storedUser from localStorage as primary source of truth
    // This ensures immediate updates when login() writes to localStorage
    const currentUser = storedUser || user;
    return currentUser !== null && token !== null;
  }, [user]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    // Store in localStorage first (synchronous)
    setAuthUser(userData, accessToken, refreshToken);
    
    // Update user state - this will trigger useMemo to recalculate isAuthenticated
    setUser(userData);
  };

  const logout = () => {
    removeAuthUser();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext for useAuth hook
export { AuthContext };

