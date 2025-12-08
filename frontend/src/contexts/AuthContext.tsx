import { createContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { getAuthUser, setAuthUser, removeAuthUser } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage
  const [user, setUser] = useState<User | null>(() => getAuthUser());
  const navigate = useNavigate();

  const login = (userData: User) => {
    setAuthUser(userData);
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
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext for useAuth hook
export { AuthContext };

