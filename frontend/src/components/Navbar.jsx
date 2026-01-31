import React from 'react';
import { LogOut, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <Building2 className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 leading-none">BS1 Swahilipot hub</h1>
                                <p className="text-sm text-gray-500">Technology</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="text-right mr-4 hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">Anthony Muhati</p>
                            <p className="text-xs text-gray-500">anthonymuhati52@gmail.com</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
