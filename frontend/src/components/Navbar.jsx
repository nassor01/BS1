import { useState, useEffect } from 'react';
import { LogOut, Building2, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import spfLogo from '../assets/sph-logo (1).png';

const Navbar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (err) {
                console.error('Error parsing user data:', err);
                localStorage.removeItem('user');
            }
        }
        return { fullName: 'User', email: '' };
    });

    useEffect(() => {
        if (!localStorage.getItem('user')) {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('activeSessions');
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button
                            onClick={onMenuClick}
                            className="p-2 -ml-2 mr-2 rounded-md text-gray-500 hover:text-[#0B4F6C] hover:bg-gray-100 focus:outline-none"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
                            <img 
                                src={spfLogo} 
                                alt="Swahilipot Hub" 
                                className="w-12 h-12 mr-3 object-contain"
                            />
                            <div>
                                <h1 className="text-lg font-bold text-[#0B4F6C] leading-none tracking-tight"> Swahilipot Hub </h1>
                                <p className="text-xs text-gray-500 font-medium">Booking System</p>
                            </div>
                        </Link>
                    </div>
                    <div className="flex items-center">
                        <div className="text-right mr-4 hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 bg-[#0B4F6C] text-white rounded-lg text-sm font-medium hover:bg-[#0a3d5c] transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
