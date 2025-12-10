import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ textAlign: 'center' }}>
      {isAuthenticated && user && (
        <div style={{ marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <span>Welcome,</span>
          <strong>{user.username}</strong>
        </div>
      )}
      <h2>Welcome to Carbon Footprint Tracker</h2>
      <p>Track and monitor your carbon emissions to reduce your environmental impact.</p>
      
      <div>
        <h3>Get Started</h3>
        <p>Start tracking your carbon footprint today!</p>
        <Link to="/login">Login</Link> or <Link to="/registration">Register</Link> or <Link to="/dashboard">View Dashboard</Link>
      </div>
    </div>
  );
}

export default Home;

