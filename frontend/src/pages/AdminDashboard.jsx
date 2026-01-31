import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, LogOut, LayoutGrid, Building2 } from 'lucide-react';
import AddRoomModal from '../components/AddRoomModal';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/admin/login');
            return;
        }

        const storedRooms = JSON.parse(localStorage.getItem('rooms')) || [
            { id: 1, name: 'Conference Room A', floor: 'Floor 1', capacity: 10, amenities: ['Projector', 'Whiteboard'], status: 'Available' },
            { id: 2, name: 'Meeting Room B', floor: 'Floor 1', capacity: 6, amenities: ['Whiteboard'], status: 'Available' },
            { id: 3, name: 'Boardroom', floor: 'Floor 2', capacity: 12, amenities: ['Projector', 'Video Conference'], status: 'Available' },
            { id: 4, name: 'Focus Room 1', floor: 'Floor 2', capacity: 2, amenities: ['Whiteboard'], status: 'Available' },
        ];
        setRooms(storedRooms);
        localStorage.setItem('rooms', JSON.stringify(storedRooms));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/admin/login');
    };

    const deleteRoom = (id) => {
        const updatedRooms = rooms.filter(r => r.id !== id);
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    };

    const handleAddRoom = (newRoom) => {
        const updatedRooms = [...rooms, newRoom];
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <AddRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddRoom}
            />
            {/* Admin Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">Admin Control Panel</h1>
                        <p className="text-sm text-gray-500">Manage Rooms</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="flex justify-between items-center mb-8 text-center sm:text-left flex-col sm:flex-row gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 scale-100 hover:scale-105"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Room
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rooms.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.floor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity} people</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteRoom(room.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
