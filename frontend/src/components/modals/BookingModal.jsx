import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, Users } from 'lucide-react';
import bookingService from '../../services/bookingService';

const BookingModal = ({ isOpen, onClose, room, type, onSuccess }) => {
    // Early return must be BEFORE any hooks
    if (!isOpen || !room) return null;

    const isReservation = type === 'reservation';
    const [formData, setFormData] = useState({
        date: new Date().toLocaleDateString('en-CA'),
        startTime: '',
        endTime: '',
    });
    const [selectedDates, setSelectedDates] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState('');
    const [queueInfo, setQueueInfo] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragModeRef = useRef(null);
    const calendarRef = useRef(null);

    const formatDateISO = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const toggleDate = (dateStr) => {
        setSelectedDates(prev => {
            if (prev.includes(dateStr)) {
                return prev.filter(d => d !== dateStr).sort();
            }
            return [...prev, dateStr].sort();
        });
    };

    const handleDateInteraction = (dateStr, action = 'toggle') => {
        if (action === 'select') {
            if (!selectedDates.includes(dateStr)) {
                setSelectedDates(prev => [...prev, dateStr].sort());
            }
        } else if (action === 'deselect') {
            setSelectedDates(prev => prev.filter(d => d !== dateStr));
        } else {
            toggleDate(dateStr);
        }
    };

    const handleDateMouseDown = (dateStr, e) => {
        e.preventDefault();
        const isSelected = selectedDates.includes(dateStr);
        dragModeRef.current = isSelected ? 'deselect' : 'select';
        setIsDragging(true);
        handleDateInteraction(dateStr, dragModeRef.current);
    };

    const handleDateMouseEnter = (dateStr) => {
        if (isDragging && dragModeRef.current) {
            handleDateInteraction(dateStr, dragModeRef.current);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragModeRef.current = null;
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleMouseUp);
            return () => {
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [isDragging]);

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    const isDateInPast = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(dateStr + 'T00:00:00');
        return checkDate < today;
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
        setQueueInfo(null);

        const userStr = localStorage.getItem('user');
        if (!userStr) {
            setError('Please login to book a room');
            setLoading(false);
            return;
        }
        const user = JSON.parse(userStr);

        if (isReservation && selectedDates.length === 0) {
            setError('Please select at least one date for your reservation');
            setLoading(false);
            return;
        }

        try {
            setProgress('Submitting your request...');

            const payload = {
                userId: user.id,
                roomId: room.id,
                startTime: convertTime(formData.startTime),
                endTime: convertTime(formData.endTime),
                type: type
            };

            if (isReservation) {
                payload.dates = selectedDates;
            } else {
                payload.date = formData.date;
            }

            const response = await bookingService.createBooking(payload);
            const data = await response.json();

            if (response.ok) {
                setProgress('');
                if (data.booking && data.booking.queuePositions && Object.keys(data.booking.queuePositions).length > 0) {
                    setQueueInfo(data.booking.queuePositions);
                }
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    if (onSuccess) onSuccess(type);
                }, 3000);
            } else {
                setProgress('');
                setError(data.error || data.details || 'Booking failed');
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

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const renderCalendarGrid = () => {
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10" />);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = formatDateISO(dateObj);
            const isSelected = selectedDates.includes(dateStr);
            const isPast = isDateInPast(dateStr);
            const isToday = dateStr === new Date().toLocaleDateString('en-CA');

            days.push(
                <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onMouseDown={(e) => !isPast && handleDateMouseDown(dateStr, e)}
                    onMouseEnter={() => !isPast && handleDateMouseEnter(dateStr)}
                    onTouchStart={(e) => !isPast && handleDateMouseDown(dateStr, e)}
                    onTouchMove={(e) => {
                        if (!isPast && isDragging) {
                            const touch = e.touches[0];
                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (element && element.dataset && element.dataset.date) {
                                handleDateInteraction(element.dataset.date, dragModeRef.current);
                            }
                        }
                    }}
                    data-date={dateStr}
                    className={`
                        h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium
                        transition-all duration-150 select-none touch-none
                        ${isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSelected
                                ? 'bg-black text-white shadow-lg scale-105'
                                : isToday
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'text-gray-700 hover:bg-gray-100 active:scale-95'
                        }
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isReservation ? 'Reserve' : 'Book'} {room.name}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                {isReservation
                                    ? 'Tap or drag to select dates for your reservation'
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
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium whitespace-pre-line flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
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
                        {queueInfo && Object.keys(queueInfo).length > 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-2 mb-2">
                                    <Users className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm font-bold text-amber-800">Queue Position Notice</p>
                                </div>
                                <p className="text-sm text-amber-700 mb-3">
                                    Someone else has already requested this room. You've been added to the queue:
                                </p>
                                <ul className="space-y-1">
                                    {Object.entries(queueInfo).map(([date, position]) => (
                                        <li key={date} className="text-sm text-amber-800 flex items-center gap-2">
                                            <span className="font-medium">{formatDateDisplay(date)}:</span>
                                            <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-xs font-bold">
                                                Position #{position}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {isReservation ? (
                            <div className="space-y-4" ref={calendarRef}>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                                        <CalendarIcon className="w-4 h-4 mr-1.5" />
                                        Select Dates
                                    </label>
                                    {selectedDates.length > 0 && (
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
                                        </span>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(-1)}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <span className="font-semibold text-gray-900">{monthYear}</span>
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(1)}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {weekDays.map(day => (
                                            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {renderCalendarGrid()}
                                    </div>
                                </div>

                                {selectedDates.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedDates.map(date => (
                                            <span
                                                key={date}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs font-medium"
                                            >
                                                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDate(date)}
                                                    className="ml-0.5 text-white/70 hover:text-white transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
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
