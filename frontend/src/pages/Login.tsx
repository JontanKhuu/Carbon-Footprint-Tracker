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
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
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
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="usernameOrEmail">Email or Username:</label>
          <input
            type="text"
            id="usernameOrEmail"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>
        Don't have an account? <Link to="/registration">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;

