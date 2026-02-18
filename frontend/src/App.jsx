import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordPin from './pages/ResetPasswordPin';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password-pin" element={<ResetPasswordPin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* User dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* 404 fallback */}
        <Route path="*" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
            <div style={{ background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>404</h1>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>Page not found. You might be using the wrong URL.</p>
              <Link to="/login" style={{ display: 'inline-block', padding: '10px 24px', background: '#0B4F6C', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
