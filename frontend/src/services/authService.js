import { apiFetch, authenticatedFetch, saveTokens, clearAuth } from './api';

const authService = {
    /**
     * Login user and store tokens
     */
    async login(email, password) {
        const response = await apiFetch('/login', {
            method: 'POST',
            body: { email, password },
        });

        if (response.ok) {
            const data = await response.json();
            // Store tokens and user data
            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        const error = await response.json();
        return { success: false, error: error.error };
    },

    /**
     * Signup new user and store tokens
     */
    async signup(email, password, fullName, department) {
        const response = await apiFetch('/signup', {
            method: 'POST',
            body: { email, password, fullName, department },
        });

        if (response.ok) {
            const data = await response.json();
            // Store tokens and user data
            saveTokens(data.accessToken, data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        }

        const error = await response.json();
        return { success: false, error: error.error || error.details };
    },

    /**
     * Logout user and clear tokens
     */
    logout() {
        clearAuth();
        window.location.href = '/login';
    },

    /**
     * Get current user from localStorage
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    /**
     * Check if current user is admin
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    /**
     * Fetch current user data from server (with authentication)
     */
    async fetchCurrentUser() {
        const response = await authenticatedFetch('/me', {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data: data.user };
        }

        return { success: false, error: 'Failed to fetch user data' };
    }
};

export default authService;
