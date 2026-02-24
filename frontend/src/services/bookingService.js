import { authenticatedFetch } from './api';

const bookingService = {
    /**
     * Create a new booking (requires authentication)
     */
    async createBooking(data) {
        return await authenticatedFetch('/book', {
            method: 'POST',
            body: data,
        });
    },

    /**
     * Update booking status (requires admin authentication)
     */
    async updateBookingStatus(id, status, adminNotes = '') {
        return await authenticatedFetch(`/bookings/${id}/status`, {
            method: 'PUT',
            body: { status, adminNotes },
        });
    },

    /**
     * Get all bookings (requires admin authentication)
     */
    async getAdminBookings() {
        return await authenticatedFetch('/admin/bookings');
    },

    /**
     * Get bookings for a specific user (requires authentication)
     */
    async getUserBookings(userId) {
        return await authenticatedFetch(`/bookings/user/${userId}`);
    },

    /**
     * Cancel a booking (requires authentication)
     */
    async cancelBooking(id, reason) {
        return await authenticatedFetch(`/bookings/${id}/cancel`, {
            method: 'PUT',
            body: { reason },
        });
    },
};

export default bookingService;
