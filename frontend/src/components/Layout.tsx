import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Layout() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header/Navigation that appears on all pages */}
      <header style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        padding: '15px 20px',
        marginBottom: '20px'
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: '0 0 auto' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>
              <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>
                Carbon Footprint Tracker
              </Link>
            </h1>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: '20px',
              alignItems: 'center'
            }}>
              <li><Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>Home</Link></li>
              {isAuthenticated ? (
                <>
                  <li><Link to="/dashboard" style={{ textDecoration: 'none', color: '#007bff' }}>Dashboard</Link></li>
                  <li><Link to="/add-emission" style={{ textDecoration: 'none', color: '#007bff' }}>Add Emission</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>Login</Link></li>
                  <li><Link to="/registration" style={{ textDecoration: 'none', color: '#007bff' }}>Register</Link></li>
                </>
              )}
            </ul>
          </div>
          
          {/* User info and logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flex: '0 0 auto',
            marginLeft: '30px'
          }}>
            {isAuthenticated && user ? (
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                }}
              >
                Logout
              </button>
            ) : (
              <span style={{ color: '#666', fontSize: '14px' }}>
                Not logged in
              </span>
            )}
          </div>
        </nav>
      </header>

      {/* This is where child routes (Home, Login, Dashboard) will render */}
      <main>
        <Outlet />
      </main>

      {/* Optional footer */}
      <footer style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>&copy; 2025 Carbon Footprint Tracker</p>
      </footer>
    </div>
  );
}

export default Layout;
