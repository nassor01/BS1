import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronDown, Plus, Trash2 } from 'lucide-react';
import bookingService from '../../services/bookingService';

const BookingModal = ({ isOpen, onClose, room, type, onSuccess }) => {
    const isReservation = type === 'reservation';
    const [formData, setFormData] = useState({
        date: new Date().toLocaleDateString('en-CA'),
        startTime: '',
        endTime: '',
    });
    // Multi-date state for reservations
    const [selectedDates, setSelectedDates] = useState([]);
    const [dateToAdd, setDateToAdd] = useState(new Date().toLocaleDateString('en-CA'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState('');

    if (!isOpen || !room) return null;

    const addDate = () => {
        if (!dateToAdd) return;
        if (selectedDates.includes(dateToAdd)) {
            setError('This date is already selected');
            return;
        }
        setSelectedDates(prev => [...prev, dateToAdd].sort());
        setError('');
    };

    const removeDate = (dateToRemove) => {
        setSelectedDates(prev => prev.filter(d => d !== dateToRemove));
    };

    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const convertTime = (timeStr) => {
        if (!timeStr) return '';
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        setProgress('');

        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            setError('Please login to book a room');
            setLoading(false);
            return;
        }
        const user = JSON.parse(userStr);

        // For reservations, require at least one date selected
        if (isReservation && selectedDates.length === 0) {
            setError('Please select at least one date for your reservation');
            setLoading(false);
            return;
        }

        try {
            if (isReservation) {
                // Submit a booking for each selected date
                const dates = selectedDates;
                const errors = [];

                for (let i = 0; i < dates.length; i++) {
                    setProgress(`Reserving date ${i + 1} of ${dates.length}...`);
                    const response = await bookingService.createBooking({
                        userId: user.id,
                        roomId: room.id,
                        date: dates[i],
                        startTime: convertTime(formData.startTime),
                        endTime: convertTime(formData.endTime),
                        type: type
                    });

                    const data = await response.json();
                    if (!response.ok) {
                        errors.push(`${formatDateDisplay(dates[i])}: ${data.error || data.details || 'Failed'}`);
                    }
                }

                if (errors.length > 0 && errors.length === dates.length) {
                    // All failed
                    setError(`All reservations failed:\n${errors.join('\n')}`);
                } else if (errors.length > 0) {
                    // Some failed
                    setError(`Some dates failed:\n${errors.join('\n')}`);
                    setSuccess(true);
                    setProgress('');
                    setTimeout(() => {
                        onClose();
                        if (onSuccess) onSuccess(type);
                    }, 3000);
                } else {
                    // All succeeded
                    setSuccess(true);
                    setProgress('');
                    setTimeout(() => {
                        onClose();
                        if (onSuccess) onSuccess(type);
                    }, 2000);
                }
            } else {
                // Single booking flow (unchanged)
                const response = await bookingService.createBooking({
                    userId: user.id,
                    roomId: room.id,
                    date: formData.date,
                    startTime: convertTime(formData.startTime),
                    endTime: convertTime(formData.endTime),
                    type: type
                });

                const data = await response.json();

                if (response.ok) {
                    setSuccess(true);
                    setTimeout(() => {
                        onClose();
                        if (onSuccess) onSuccess(type);
                    }, 2000);
                } else {
                    setError(data.error || data.details || 'Booking failed');
                }
            }
        } catch (err) {
            console.error('Booking error:', err);
            setError('Network error. Please check if the backend server is running.');
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    const timeOptions = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isReservation ? 'Reserve' : 'Book'} {room.name}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                {isReservation
                                    ? 'Select one or more dates and a time slot for your reservation'
                                    : 'Select a date and time for your booking'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium whitespace-pre-line">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 font-medium">
                                {isReservation
                                    ? `Reservation submitted for ${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} successfully!`
                                    : 'Booking submitted successfully!'}
                            </div>
                        )}
                        {progress && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-600 font-medium">
                                {progress}
                            </div>
                        )}

                        {/* Date Selection */}
                        {isReservation ? (
                            /* Multi-date picker for reservations */
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700 flex items-center">
                                    <CalendarIcon className="w-4 h-4 mr-1.5" />
                                    Select Dates
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            value={dateToAdd}
                                            onChange={(e) => setDateToAdd(e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addDate}
                                        className="flex items-center gap-1.5 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>

                                {/* Selected dates list */}
                                {selectedDates.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 font-medium">
                                            {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDates.map(date => (
                                                <span
                                                    key={date}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium"
                                                >
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    {formatDateDisplay(date)}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDate(date)}
                                                        className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">
                                        No dates selected yet. Add dates using the picker above.
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* Single date picker for bookings */
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center">
                                    Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        required
                                    />
                                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Start Time Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Start Time</label>
                            <div className="relative">
                                <select
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select start time</option>
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* End Time Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">End Time</label>
                            <div className="relative">
                                <select
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select end time</option>
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : success ? 'Confirmed!' : `Confirm ${isReservation ? `Reservation${selectedDates.length > 1 ? ` (${selectedDates.length} dates)` : ''}` : 'Booking'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
