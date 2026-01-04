import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginUser } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { LoginUser } from '../types';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginUser({ usernameOrEmail, password } as LoginUser);
      // Response now includes user, access_token, refresh_token, and csrf_token
      const { user, access_token, refresh_token, csrf_token } = response.data;
      
      if (!user || !access_token || !refresh_token || !csrf_token) {
        setError('Invalid response from server. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Login updates localStorage and state synchronously (includes CSRF token)
      login(user, access_token, refresh_token, csrf_token);
      
      // Navigate immediately - isAuthenticated is now updated synchronously
      navigate('/dashboard');
    } catch (err) {
      // Set error message from API response or default message
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1px' }}>Login</h2>
      <form onSubmit={handleSubmit} style={{ 
        display: 'inline-block', 
        textAlign: 'left',
        maxWidth: '400px',
        width: '100%',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="usernameOrEmail" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email or Username:
          </label>
          <input
            type="text"
            id="usernameOrEmail"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '8px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '8px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fee',
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}
      <p style={{ marginTop: '15px' }}>
        Don't have an account? <Link to="/registration">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;

