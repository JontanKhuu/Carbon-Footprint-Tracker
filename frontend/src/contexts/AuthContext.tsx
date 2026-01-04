import { createContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { getAuthUser, setAuthUser, removeAuthUser, getAccessToken } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  login: (user: User, accessToken: string, refreshToken: string, csrfToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage
  const [user, setUser] = useState<User | null>(() => getAuthUser());
  // Initialize isAuthenticated from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = getAccessToken();
    const storedUser = getAuthUser();
    return storedUser !== null && token !== null;
  });
  const navigate = useNavigate();

  const login = (userData: User, accessToken: string, refreshToken: string, csrfToken?: string) => {
    // Store in localStorage first (synchronous)
    setAuthUser(userData, accessToken, refreshToken, csrfToken);
    
    // Update user state and isAuthenticated synchronously
    // This ensures the state is updated before navigation
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

