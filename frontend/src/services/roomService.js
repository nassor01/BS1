import { apiFetch, authenticatedFetch } from './api';

const roomService = {
    /**
     * Get all rooms (public - no authentication required)
     */
    async getRooms(date) {
        const queryParam = date ? `?date=${date}` : '';
        const response = await apiFetch(`/rooms${queryParam}`);

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Get room by ID (public - no authentication required)
     */
    async getRoomById(id) {
        const response = await apiFetch(`/rooms/${id}`);

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Create a new room (requires admin authentication)
     */
    async createRoom(data) {
        const response = await authenticatedFetch('/rooms', {
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
     * Delete a room (requires admin authentication)
     */
    async deleteRoom(id) {
        const response = await authenticatedFetch(`/rooms/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },
};

export default roomService;
