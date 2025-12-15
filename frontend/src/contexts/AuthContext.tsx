import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
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

  // Compute isAuthenticated as a derived value
  const isAuthenticated = useMemo(() => {
    const token = getAccessToken();
    const storedUser = getAuthUser();
    return (user !== null || storedUser !== null) && token !== null;
  }, [user]);

  // Restore user from localStorage if token exists but user state is null
  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getAuthUser();
    
    if (token && storedUser && !user) {
      setUser(storedUser);
    }
  }, [user]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    // Store in localStorage first
    setAuthUser(userData, accessToken, refreshToken);
    
    // Update state - this will trigger re-render and update isAuthenticated
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

