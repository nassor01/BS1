import { authenticatedFetch } from './api';

const bookingService = {
    /**
     * Create a new booking (requires authentication)
     */
    async createBooking(data) {
        const response = await authenticatedFetch('/book', {
            method: 'POST',
            body: data,
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error || error.details };
    },

    /**
     * Update booking status (requires admin authentication)
     */
    async updateBookingStatus(id, status, adminNotes = '') {
        const response = await authenticatedFetch(`/bookings/${id}/status`, {
            method: 'PUT',
            body: { status, adminNotes },
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Get all bookings (requires admin authentication)
     */
    async getAdminBookings() {
        const response = await authenticatedFetch('/admin/bookings');

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Get bookings for a specific user (requires authentication)
     */
    async getUserBookings(userId) {
        const response = await authenticatedFetch(`/bookings/user/${userId}`);

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },
};

export default bookingService;
