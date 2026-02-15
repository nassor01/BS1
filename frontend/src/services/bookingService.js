import { apiFetch } from './api';

const bookingService = {
    async createBooking(data) {
        const response = await apiFetch('/book', {
            method: 'POST',
            body: data,
        });
        return response;
    },

    async updateBookingStatus(id, status) {
        const response = await apiFetch(`/bookings/${id}/status`, {
            method: 'PUT',
            body: { status },
        });
        return response;
    },

    async getAdminBookings() {
        const response = await apiFetch('/admin/bookings');
        return response;
    },

    async getUserBookings(userId) {
        const response = await apiFetch(`/bookings/user/${userId}`);
        return response;
    },
};

export default bookingService;
