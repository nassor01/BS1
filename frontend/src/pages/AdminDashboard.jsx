import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, LogOut, LayoutGrid, Building2, Users, Clock, Monitor, XCircle } from 'lucide-react';
import AddRoomModal from '../components/modals/AddRoomModal';
import Footer from '../components/layout/Footer';
import roomService from '../services/roomService';
import bookingService from '../services/bookingService';
import authService from '../services/authService';
import socketService from '../services/socketService';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [activeTab, setActiveTab] = useState('rooms'); // 'rooms', 'users', or 'bookings'
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Rooms for Today (to get dynamic status)
            const today = new Date().toLocaleDateString('en-CA');
            const roomsRes = await roomService.getRooms(today);
            const roomsData = await roomsRes.json();
            
            // Show only available rooms - booked/reserved rooms should not appear in the list
            const availableRooms = roomsData.filter(room => room.status === 'Available');
            setRooms(availableRooms);

            // Fetch Admin Bookings
            const bookingsRes = await bookingService.getAdminBookings();
            const bookingsData = await bookingsRes.json();
            setBookings(bookingsData);

            // Fetch active users from backend
            const usersRes = await authService.getActiveUsers();
            if (usersRes.success) {
                setActiveSessions(usersRes.activeUsers);
            }
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        fetchData();

        // Set up real-time socket connection for active users
        socketService.connect(
            () => setIsConnected(true),
            () => setIsConnected(false)
        );
        
        const handleActiveUsersUpdate = (activeUsers) => {
            setActiveSessions(activeUsers);
        };
        
        socketService.onActiveUsersUpdate(handleActiveUsersUpdate);

        return () => {
            socketService.offActiveUsersUpdate(handleActiveUsersUpdate);
        };
    }, [navigate]);

    const calculateDuration = (loginTime) => {
        if (!loginTime) return 'Unknown';
        try {
            const start = new Date(loginTime);
            if (isNaN(start.getTime())) return 'Invalid';
            const now = new Date();
            const diff = Math.floor((now - start) / 60000); // duration in minutes
            if (diff < 60) return `${diff} mins`;
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            return `${hours}h ${mins}m`;
        } catch (e) {
            console.error('Error calculating duration:', e);
            return 'Error';
        }
    };

    const removeSession = async (id) => {
        if (!window.confirm('Are you sure you want to disconnect this user?')) return;
        
        try {
            const result = await authService.disconnectUser(id);
            if (result.success) {
                // Remove from local state immediately
                setActiveSessions(prev => prev.filter(s => s.id !== id));
                alert('User disconnected successfully');
            } else {
                alert(result.error || 'Failed to disconnect user');
            }
        } catch (err) {
            console.error('Error disconnecting user:', err);
            alert('Error disconnecting user');
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logoutWithNotification();
        } catch (error) {
            // Force logout locally even if server call fails
            authService.logout();
        }
    };

    const deleteRoom = async (id) => {
        if (!window.confirm('Are you sure you want to delete this room? This will also delete all its bookings.')) return;

        try {
            const res = await roomService.deleteRoom(id);

            if (res.ok) {
                setRooms(prev => prev.filter(r => r.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete room');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleAddRoom = async (roomData) => {
        try {
            const res = await roomService.createRoom(roomData);

            if (res.ok) {
                const newRoom = await res.json();
                setRooms(prev => [...prev, newRoom]);
                setIsModalOpen(false);
                setEditingRoom(null);
                alert(`Room "${newRoom.name}" added successfully!`);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add room');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const handleUpdateRoom = async (roomData) => {
        try {
            const res = await roomService.updateRoom(roomData.id, roomData);

            if (res.ok) {
                const updatedRoom = await res.json();
                setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                setIsModalOpen(false);
                setEditingRoom(null);
                alert(`Room "${updatedRoom.name}" updated successfully!`);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update room');
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    const openEditModal = (room) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        const action = newStatus === 'confirmed' ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${action} this booking?`)) return;

        try {
            const res = await bookingService.updateBookingStatus(bookingId, newStatus);

            if (res.ok) {
                // Update local state to reflect change instantly
                setBookings(prev => prev.map(b =>
                    b.id === bookingId ? { ...b, status: newStatus } : b
                ));

                // If confirmed, refresh rooms - only show available ones
                if (newStatus === 'confirmed') {
                    const today = new Date().toLocaleDateString('en-CA');
                    const roomsRes = await roomService.getRooms(today);
                    const roomsData = await roomsRes.json();
                    const availableRooms = roomsData.filter(room => room.status === 'Available');
                    setRooms(availableRooms);
                }

                alert(`Booking ${action}d successfully and user notified!`);
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${action} booking`);
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <AddRoomModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingRoom(null); }}
                onAdd={handleAddRoom}
                room={editingRoom}
                onUpdate={handleUpdateRoom}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'rooms' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Rooms
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bookings' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Bookings
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Active Users
                            <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} title={isConnected ? 'Real-time connected' : 'Reconnecting...'}>
                            </span>
                        </button>
                    </div>

                    {activeTab === 'rooms' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 scale-100 hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Room
                        </button>
                    )}
                </div>

                {activeTab === 'rooms' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.space}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity} people</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => openEditModal(room)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
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
                ) : activeTab === 'bookings' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User / Room</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.length > 0 ? bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{booking.user_name}</span>
                                                <span className="text-xs text-gray-500">{booking.room_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col text-sm text-gray-900">
                                                <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-500">{booking.start_time} - {booking.end_time}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.type === 'booking' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {booking.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                        className="text-green-600 hover:text-green-900 mr-3 font-bold"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900 font-bold"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No bookings or reservations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeSessions.length > 0 ? (
                                    activeSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                        <Monitor className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{session.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                    {session.loginTime ? new Date(session.loginTime).toLocaleTimeString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateDuration(session.loginTime)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {session.id === currentUser?.id ? (
                                                    <span className="text-gray-400 text-xs italic">Current session</span>
                                                ) : (
                                                    <button
                                                        onClick={() => removeSession(session.id)}
                                                        className="text-red-600 hover:text-red-900 flex items-center justify-end ml-auto"
                                                        title="Disconnect User"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Disconnect
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No active user sessions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default AdminDashboard;
