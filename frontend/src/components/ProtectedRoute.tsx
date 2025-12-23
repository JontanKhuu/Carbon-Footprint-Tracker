import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAuthUser, getAccessToken } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  
  // Check localStorage directly as fallback to ensure immediate authentication check
  // This handles cases where React batches state updates and isAuthenticated hasn't updated yet
  const token = getAccessToken();
  const storedUser = getAuthUser();
  const isAuthFromStorage = storedUser !== null && token !== null;
  
  // Use context state if available, otherwise fall back to localStorage check
  const authenticated = isAuthenticated || isAuthFromStorage;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

