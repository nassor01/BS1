import React from 'react';
import { Home, LayoutGrid, Bookmark, Calendar, LogOut, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, currentView, onNavigate, onLogout }) => {
    const menuItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'available', label: 'Rooms', icon: LayoutGrid },
        { id: 'reserved', label: 'Reserved Rooms', icon: Bookmark },
        { id: 'booked', label: 'Booked Rooms', icon: Calendar },
    ];

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/10 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <div
                className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <span className="text-xl font-bold text-gray-800">Menu</span>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col justify-between h-[calc(100%-4rem)] p-4">
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === item.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${currentView === item.id ? 'text-blue-700' : 'text-gray-400'
                                    }`} />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="border-t border-gray-200 pt-4">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
