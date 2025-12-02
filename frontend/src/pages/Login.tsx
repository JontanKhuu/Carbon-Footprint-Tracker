import { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
  const [password, setPassword] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login API call
    
    console.log('Login attempt:', { usernameOrEmail, password });
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
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/registration">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;

