import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import AddEmission from './pages/AddEmission';
import EmissionsList from './pages/EmissionsList';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registration" element={<Registration />} /> 
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="add-emission" 
              element={
                <ProtectedRoute>
                  <AddEmission />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="emissions" 
              element={
                <ProtectedRoute>
                  <EmissionsList />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
