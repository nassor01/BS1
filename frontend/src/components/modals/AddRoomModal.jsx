import React, { useState } from 'react';
import { X, Building2, Users, Layers, Star } from 'lucide-react';

const AddRoomModal = ({ isOpen, onClose, onAdd }) => {
    const [roomData, setRoomData] = useState({
        name: '',
        space: '',
        capacity: '',
        amenities: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const newRoom = {
            id: Date.now(),
            name: roomData.name,
            space: roomData.space,
            capacity: parseInt(roomData.capacity),
            amenities: roomData.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
            status: 'Available',
            type: 'available'
        };
        onAdd(newRoom);
        setRoomData({ name: '', space: '', capacity: '', amenities: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Add New Room</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Room Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={roomData.name}
                                onChange={e => setRoomData({ ...roomData, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                                placeholder="Conference Room C"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Space</label>
                            <div className="relative">
                                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={roomData.space}
                                    onChange={e => setRoomData({ ...roomData, space: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Ground Floor"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Capacity</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    required
                                    value={roomData.capacity}
                                    onChange={e => setRoomData({ ...roomData, capacity: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Amenities (comma separated)</label>
                        <div className="relative">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={roomData.amenities}
                                onChange={e => setRoomData({ ...roomData, amenities: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="Projector, Wifi, AC"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                            Save Room
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRoomModal;
