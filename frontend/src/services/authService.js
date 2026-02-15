import { apiFetch } from './api';

const authService = {
    async login(email, password) {
        const response = await apiFetch('/login', {
            method: 'POST',
            body: { email, password },
        });
        return response;
    },

    async signup(email, password, fullName, department) {
        const response = await apiFetch('/signup', {
            method: 'POST',
            body: { email, password, fullName, department },
        });
        return response;
    },
};

export default authService;
