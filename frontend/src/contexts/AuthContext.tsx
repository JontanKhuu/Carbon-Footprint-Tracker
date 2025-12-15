import { createContext, useState, useEffect, type ReactNode } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const storedUser = getAuthUser();
    const token = getAccessToken();
    return storedUser !== null && token !== null;
  });
  const navigate = useNavigate();

  // Update isAuthenticated when user or token changes
  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getAuthUser();
    const authenticated = (user !== null || storedUser !== null) && token !== null;
    
    if (authenticated !== isAuthenticated) {
      setIsAuthenticated(authenticated);
    }
    
    // If we have a token but no user state, restore user from localStorage
    if (token && storedUser && !user) {
      setUser(storedUser);
    }
  }, [user, isAuthenticated]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    // Store in localStorage first
    setAuthUser(userData, accessToken, refreshToken);
    
    // Update state - this should trigger re-render
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeAuthUser();
    setUser(null);
    setIsAuthenticated(false);
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

