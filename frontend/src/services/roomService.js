import { apiFetch } from './api';

const roomService = {
    async getRooms(date) {
        const queryParam = date ? `?date=${date}` : '';
        const response = await apiFetch(`/rooms${queryParam}`);
        return response;
    },

    async getRoomById(id) {
        const response = await apiFetch(`/rooms/${id}`);
        return response;
    },

    async createRoom(data) {
        const response = await apiFetch('/rooms', {
            method: 'POST',
            body: data,
        });
        return response;
    },

    async deleteRoom(id) {
        const response = await apiFetch(`/rooms/${id}`, {
            method: 'DELETE',
        });
        return response;
    },
};

export default roomService;
