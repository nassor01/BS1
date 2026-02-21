import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User } from 'lucide-react';
import authService from '../services/authService';
import spfLogo from '../assets/sph-logo (1).png';

const RECAPTCHA_SITE_KEY = '6Ld9vHAsAAAAALZLg1TvrkYJCA9WiPkNU2Ml_s83';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recaptchaReady, setRecaptchaReady] = useState(false);
    const recaptchaRef = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        const loadRecaptcha = () => {
            if (window.grecaptcha && window.grecaptcha.render) {
                setRecaptchaReady(true);
            } else {
                const checkRecaptcha = setInterval(() => {
                    if (window.grecaptcha && window.grecaptcha.render) {
                        clearInterval(checkRecaptcha);
                        setRecaptchaReady(true);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkRecaptcha), 5000);
            }
        };

        if (!window.grecaptcha) {
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = loadRecaptcha;
            script.onerror = () => {
                console.error('Failed to load reCAPTCHA script');
                setError('Failed to load captcha. Please refresh and try again.');
            };
            document.head.appendChild(script);
        } else {
            loadRecaptcha();
        }
    }, []);

    useEffect(() => {
        if (recaptchaReady && window.grecaptcha && window.grecaptcha.render && recaptchaRef.current && widgetId.current === null) {
            try {
                widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                    sitekey: RECAPTCHA_SITE_KEY,
                    theme: 'light'
                });
            } catch (err) {
                console.error('reCAPTCHA render error:', err);
            }
        }
    }, [recaptchaReady]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let captchaToken = '';
        try {
            if (window.grecaptcha && widgetId.current !== null) {
                captchaToken = window.grecaptcha.getResponse(widgetId.current);
            }
        } catch (err) {
            console.error('Captcha error:', err);
        }
        
        if (!captchaToken) {
            setError('Please complete the captcha verification.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authService.adminLogin(formData.email, formData.password, captchaToken);

            if (response.success) {
                const data = response.data;
                if (data.user.role === 'super_admin' || data.user.role === 'admin') {
                    // User data already stored by authService
                    localStorage.setItem('isAdmin', 'true');
                    if (data.user.role === 'super_admin') {
                        navigate('/super-admin/dashboard');
                    } else {
                        navigate('/admin/dashboard');
                    }
                } else {
                    setError('Access denied. This portal is for administrators only.');
                }
            } else {
                // Special handling for database connection errors (503)
                if (response.status === 503) {
                    setError('Database connection error. Please ensure MySQL is running.');
                } else {
                    setError(response.error || 'Invalid Admin Credentials');
                }
            }
        } catch (err) {
            setError('System connection failed. Please ensure the backend is running.');
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
                        Admin Portal
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Sign in to manage rooms</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Admin Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                placeholder="admin@swahilipot.com"
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
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Verify you're human</label>
                        <div className="bg-gray-100 p-4 rounded-lg flex justify-center items-center min-h-[78px]">
                            {recaptchaReady ? (
                                <div ref={recaptchaRef}></div>
                            ) : (
                                <span className="text-gray-500">Loading captcha...</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                        Back to User Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
