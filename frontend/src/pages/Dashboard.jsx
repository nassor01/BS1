import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, DoorOpen, Bookmark, X, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import BookingModal from '../components/modals/BookingModal';
import Footer from '../components/layout/Footer';
import roomService from '../services/roomService';
import bookingService from '../services/bookingService';
import socketService from '../services/socketService';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [modalType, setModalType] = useState('booking');
    const [rooms, setRooms] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('available');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [cancelSuccess, setCancelSuccess] = useState('');

    useEffect(() => {
        const viewParam = searchParams.get('view');
        if (viewParam === 'booked' || viewParam === 'reserved') {
            setCurrentView(viewParam);
        }
    }, [searchParams]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            const [roomsRes, bookingsRes] = await Promise.all([
                roomService.getRooms(selectedDate),
                user ? bookingService.getUserBookings(user.id) : Promise.resolve({ ok: false })
            ]);

            if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
            const roomsData = await roomsRes.json();
            setRooms(roomsData);

            if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json();
                setUserBookings(bookingsData);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Could not load data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        socketService.connect(
            () => {},
            () => {}
        );

        const handleRoomCreated = (newRoom) => {
            setRooms(prev => {
                if (prev.some(r => r.id === newRoom.id)) return prev;
                return [...prev, newRoom];
            });
        };

        const handleRoomDeleted = ({ id }) => {
            setRooms(prev => prev.filter(r => r.id !== id));
        };

        socketService.onRoomCreated(handleRoomCreated);
        socketService.onRoomDeleted(handleRoomDeleted);

        return () => {
            socketService.offRoomCreated(handleRoomCreated);
            socketService.offRoomDeleted(handleRoomDeleted);
        };
    }, []);

    const handleNavigate = (viewId) => {
        if (viewId === 'home' || viewId === 'available') {
            setCurrentView('available');
        } else {
            setCurrentView(viewId);
        }
        setIsSidebarOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    const openModal = (room, type) => {
        setSelectedRoom(room);
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleBookingSuccess = (bookingType) => {
        if (bookingType === 'reservation') {
            setCurrentView('reserved');
        } else {
            setCurrentView('booked');
        }
        fetchData();
    };

    const openCancelModal = (booking) => {
        setSelectedBooking(booking);
        setCancelReason('');
        setCancelError('');
        setCancelSuccess('');
        setIsCancelModalOpen(true);
    };

    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) {
            setCancelError('Please provide a cancellation reason');
            return;
        }

        setCancelLoading(true);
        setCancelError('');

        try {
            const response = await bookingService.cancelBooking(selectedBooking.id, cancelReason);
            
            if (response.ok) {
                setCancelSuccess('Booking cancelled successfully');
                setTimeout(() => {
                    setIsCancelModalOpen(false);
                    fetchData();
                }, 1500);
            } else {
                const data = await response.json();
                setCancelError(data.error || 'Failed to cancel booking');
            }
        } catch (err) {
            setCancelError('Network error. Please try again.');
        } finally {
            setCancelLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.amenities?.some(amenity => amenity.toLowerCase().includes(searchTerm.toLowerCase()));
        return currentView === 'available' ? matchesSearch : false;
    });

    const filteredBookings = userBookings.filter(booking => {
        const matchesSearch = booking.room_name?.toLowerCase().includes(searchTerm.toLowerCase());
        console.log('Filtering booking:', booking, 'currentView:', currentView);
        if (currentView === 'reserved') return matchesSearch && booking.type === 'reservation';
        if (currentView === 'booked') return matchesSearch && booking.type === 'booking';
        return true;
    });

    const getPageTitle = () => {
        switch (currentView) {
            case 'reserved': return 'Reserved Rooms';
            case 'booked': return 'Booked Rooms';
            default: return 'Available Rooms';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                room={selectedRoom}
                type={modalType}
                onSuccess={handleBookingSuccess}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                        {currentView === 'available' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 font-medium">For Date:</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="text-sm border-none bg-transparent font-bold text-blue-600 focus:ring-0 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>

                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search by room name, amenities, capacity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500">Loading...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button onClick={fetchData} className="text-blue-600 font-bold hover:underline">
                            Try Again
                        </button>
                    </div>
                ) : currentView !== 'available' ? (
                    filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No {currentView === 'reserved' ? 'reservations' : 'bookings'} found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{booking.room_name}</h3>
                                            <p className="text-sm text-gray-500">{booking.space}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Date:</span> {booking.booking_date}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Time:</span> {booking.start_time} - {booking.end_time}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Type:</span> {booking.type}
                                        </p>
                                    </div>

                                    {booking.status !== 'cancelled' && (
                                        <button
                                            onClick={() => openCancelModal(booking)}
                                            className="w-full mt-2 flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No rooms found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                                        <p className="text-sm text-gray-500">{room.space}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === 'Available' ? 'bg-green-100 text-green-800' :
                                        room.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {room.status}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                                    <Users className="w-4 h-4" />
                                    <span>Capacity: {room.capacity} people</span>
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-900 mb-2">Amenities:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {room.amenities?.map((amenity) => (
                                            <span key={amenity} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => openModal(room, 'booking')}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                                        disabled={room.status !== 'Available'}
                                    >
                                        <DoorOpen className="w-4 h-4 mr-2" />
                                        {room.status === 'Available' ? 'Book Room' : room.status}
                                    </button>
                                    <button
                                        onClick={() => openModal(room, 'reservation')}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                    >
                                        <Bookmark className="w-4 h-4 mr-2" />
                                        Reserve for Later
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;
