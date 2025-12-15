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
      // Response now includes user, access_token, and refresh_token
      const { user, access_token, refresh_token } = response.data;
      
      if (!user || !access_token || !refresh_token) {
        setError('Invalid response from server. Please try again.');
        return;
      }
      
      login(user, access_token, refresh_token);
      navigate('/dashboard');
    } catch (err) {
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
      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      <p style={{ marginTop: '15px' }}>
        Don't have an account? <Link to="/registration">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;

