import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, RotateCcw, RefreshCw } from 'lucide-react';
import authService from '../services/authService';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [captchaError, setCaptchaError] = useState('');
    
    const [num1] = useState(() => Math.floor(Math.random() * 10) + 1);
    const [num2] = useState(() => Math.floor(Math.random() * 10) + 1);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');

    const refreshCaptcha = () => {
        setCaptchaAnswer(String(num1 + num2));
        setCaptchaInput('');
        setCaptchaVerified(false);
    };

    useEffect(() => {
        setCaptchaAnswer(String(num1 + num2));
    }, [num1, num2]);

    const verifyCaptcha = () => {
        if (captchaInput.trim() === captchaAnswer) {
            setCaptchaVerified(true);
            setCaptchaError('');
        } else {
            setCaptchaVerified(false);
            setCaptchaError('Incorrect answer. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!captchaVerified) {
            verifyCaptcha();
            if (!captchaVerified) {
                setError('Please complete the captcha verification.');
                return;
            }
        }
        
        setError('');
        setLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.error || 'Failed to send reset PIN. Please try again.');
            }
        } catch {
            setError('Connection failed. Please check your network and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (success && email) {
            const timer = setTimeout(() => {
                navigate('/reset-password-pin', { state: { email } });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [success, email, navigate]);

    if (success) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-green-600 w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
                        <p className="text-gray-500 mt-2 text-center">
                            We've sent a <strong>6-digit PIN</strong> to <br />
                            <span className="font-medium text-gray-700">{email}</span>
                        </p>
                    </div>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Redirecting to enter PIN... (expires in 15 minutes)
                    </p>
                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <RotateCcw className="text-blue-600 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2">Enter your email and we'll send you a reset PIN.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400"
                                placeholder="you@example.com"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Verify you're human</label>
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-lg font-semibold text-gray-800">
                                    {num1} + {num2} = ?
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshCaptcha}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Refresh captcha"
                                >
                                    <RefreshCw className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="number"
                                    value={captchaInput}
                                    onChange={(e) => {
                                        setCaptchaInput(e.target.value);
                                        setCaptchaVerified(false);
                                    }}
                                    onBlur={verifyCaptcha}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                    placeholder="Enter answer"
                                    required
                                />
                                {captchaVerified && (
                                    <div className="flex items-center text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            {captchaError && (
                                <p className="text-xs text-red-500 mt-1">{captchaError}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending PIN...' : 'Send Reset PIN'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
