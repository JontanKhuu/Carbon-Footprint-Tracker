import { Outlet, Link } from 'react-router-dom';

function Layout() {
  return (
    <div>
      {/* Header/Navigation that appears on all pages */}
      <header>
        <nav>
          <h1>Carbon Footprint Tracker</h1>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/registration">Registration</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/add-emission">Add Emission</Link></li>
          </ul>
        </nav>
      </header>

      {/* This is where child routes (Home, Login, Dashboard) will render */}
      <main>
        <Outlet />
      </main>

      {/* Optional footer */}
      <footer>
        <p>&copy; 2024 Carbon Footprint Tracker</p>
      </footer>
    </div>
  );
}

export default Layout;