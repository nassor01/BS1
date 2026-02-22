import { apiFetch, authenticatedFetch } from './api';

const roomService = {
    /**
     * Get all rooms (public - no authentication required)
     */
    async getRooms(date) {
        const queryParam = date ? `?date=${date}` : '';
        return await apiFetch(`/rooms${queryParam}`);
    },

    /**
     * Get room by ID (public - no authentication required)
     */
    async getRoomById(id) {
        return await apiFetch(`/rooms/${id}`);
    },

    /**
     * Create a new room (requires admin authentication)
     */
    async createRoom(data) {
        return await authenticatedFetch('/rooms', {
            method: 'POST',
            body: data,
        });
    },

    /**
     * Delete a room (requires admin authentication)
     */
    async deleteRoom(id) {
        return await authenticatedFetch(`/rooms/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Update a room (requires admin authentication)
     */
    async updateRoom(id, data) {
        return await authenticatedFetch(`/rooms/${id}`, {
            method: 'PUT',
            body: data,
        });
    },
};

export default roomService;
