import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import authService from '../services/authService';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new password reset.');
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (formData.newPassword.length < 8) {
            return setError('Password must be at least 8 characters.');
        }

        setLoading(true);
        try {
            const response = await authService.resetPassword(token, formData.newPassword);
            if (response.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(response.error || 'Password reset failed. The link may have expired.');
            }
        } catch {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-success-icon">
                        <CheckCircle size={48} color="#16a34a" />
                    </div>
                    <h2 className="auth-title">Password Reset!</h2>
                    <p className="auth-subtitle">Your password has been changed successfully. Redirecting to login...</p>
                    <Link to="/login" className="auth-btn" style={{ display: 'inline-block', marginTop: '16px' }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-success-icon">
                        <XCircle size={48} color="#dc2626" />
                    </div>
                    <h2 className="auth-title">Invalid Link</h2>
                    <p className="auth-subtitle">This password reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="auth-btn" style={{ display: 'inline-block', marginTop: '16px' }}>
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-icon">
                    <Lock size={40} />
                </div>
                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-subtitle">Enter your new password below.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Min. 8 characters"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat new password"
                            required
                        />
                    </div>

                    <div className="password-requirements">
                        <p>Password must contain:</p>
                        <ul>
                            <li className={formData.newPassword.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                        </ul>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
