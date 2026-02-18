import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import authService from '../services/authService';

const ResetPasswordPin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [pin, setPin] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handlePinChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPin(value);
        setError('');
    };

    const handleResendPin = async () => {
        setResending(true);
        try {
            const response = await authService.forgotPassword(email);
            if (response.success) {
                setCountdown(60);
                alert('A new PIN has been sent to your email.');
            } else {
                setError(response.error || 'Failed to resend PIN.');
            }
        } catch {
            setError('Connection failed. Please try again.');
        } finally {
            setResending(false);
        }
    };

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (pin.length !== 6) {
            return setError('Please enter the 6-digit PIN.');
        }
        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (newPassword.length < 8) {
            return setError('Password must be at least 8 characters.');
        }

        setLoading(true);
        try {
            const response = await authService.resetPasswordWithPin(pin, newPassword);
            if (response.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(response.error || 'Invalid or expired PIN. Please try again.');
            }
        } catch {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-green-600 w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Password Reset!</h1>
                        <p className="text-gray-500 mt-2 text-center">
                            Your password has been changed successfully.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Redirecting to login...
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="block w-full text-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-blue-600 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Enter Reset PIN</h1>
                    <p className="text-gray-500 mt-2 text-center">
                        We sent a 6-digit PIN to <br />
                        <span className="font-medium text-gray-700">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">6-Digit PIN</label>
                        <input
                            type="text"
                            value={pin}
                            onChange={handlePinChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400 text-center text-2xl tracking-widest font-mono"
                            placeholder="000000"
                            maxLength={6}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                placeholder="Min. 8 characters"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                placeholder="Repeat new password"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            id="showPassword"
                            type="checkbox"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showPassword" className="ml-2 text-sm text-gray-600">
                            Show passwords
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 space-y-3 text-center">
                    <button
                        onClick={handleResendPin}
                        disabled={countdown > 0 || resending}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {countdown > 0 ? `Resend PIN in ${countdown}s` : resending ? 'Sending...' : 'Resend PIN'}
                    </button>
                    <div>
                        <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPin;
