import React, { useState } from 'react';
import { Search, Users, Monitor, Projector, Video, DoorOpen, Bookmark } from 'lucide-react';
import Navbar from '../components/Navbar';

const rooms = [
    {
        id: 1,
        name: 'Conference Room A',
        floor: 'Floor 1',
        capacity: 10,
        amenities: ['Projector', 'Whiteboard', 'Video Conference'],
        status: 'Available',
    },
    {
        id: 2,
        name: 'Meeting Room B',
        floor: 'Floor 1',
        capacity: 6,
        amenities: ['Whiteboard', 'TV Display'],
        status: 'Available',
    },
    {
        id: 3,
        name: 'Boardroom',
        floor: 'Floor 2',
        capacity: 12,
        amenities: ['Projector', 'Video Conference', 'AC'],
        status: 'Available',
    },
    {
        id: 4,
        name: 'Focus Room 1',
        floor: 'Floor 2',
        capacity: 2,
        amenities: ['Whiteboard'],
        status: 'Available',
    },
];

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.amenities.some(amenity => amenity.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Available Rooms</h1>

                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search by room name, amenities, capacity, or floor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredRooms.map((room) => (
                        <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                                    <p className="text-sm text-gray-500">{room.floor}</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
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
                                    {room.amenities.map((amenity, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                        >
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => alert(`Booking ${room.name}...`)}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                                >
                                    <DoorOpen className="w-4 h-4 mr-2" />
                                    Book Room
                                </button>
                                <button
                                    onClick={() => alert(`Reserving ${room.name} for later...`)}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    <Bookmark className="w-4 h-4 mr-2" />
                                    Reserve for Later
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
