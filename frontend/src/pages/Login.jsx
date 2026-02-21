import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2, User, Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';
import spfLogo from '../assets/sph-logo (1).png';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [show2fa, setShow2fa] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempToken, setTempToken] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let response;

            if (show2fa) {
                // Verify 2FA
                response = await authService.verify2fa(twoFactorCode, tempToken);
            } else {
                // Determine 2FA status
                response = await authService.login(formData.email, formData.password);
            }

            if (response.success) {
                // Handle 2FA Requirement
                if (response.require2fa) {
                    setTempToken(response.tempToken);
                    setShow2fa(true);
                    setLoading(false);
                    return;
                }

                // Redirect based on role
                if (response.data.user.role === 'super_admin') {
                    navigate('/super-admin/dashboard');
                } else if (response.data.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // Special handling for database connection errors (503)
                if (response.status === 503) {
                    setError('Database connection error. Please ensure MySQL is running (check XAMPP or MySQL service).');
                } else {
                    setError(response.error || 'Invalid credentials');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('System connection failed. Please ensure the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-8">
                    <img 
                        src={spfLogo} 
                        alt="Swahilipot Hub" 
                        className="w-24 h-24 mb-2 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {show2fa ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Enter 2FA Code</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="twoFactorCode"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Open your authenticator app to get the code.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (show2fa ? 'Verifying...' : 'Signing in...') : (show2fa ? 'Verify 2FA' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-3">
                    <Link to="/forgot-password" className="block text-sm text-blue-600 hover:text-blue-500 font-medium">
                        Forgot Password?
                    </Link>
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
