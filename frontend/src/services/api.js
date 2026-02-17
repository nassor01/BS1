// Central API configuration
const API_BASE_URL = 'http://localhost:3000';

/**
 * Get access token from localStorage
 */
const getAccessToken = () => {
    return localStorage.getItem('accessToken');
};

/**
 * Get refresh token from localStorage
 */
const getRefreshToken = () => {
    return localStorage.getItem('refreshToken');
};

/**
 * Save tokens to localStorage
 */
const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }
};

/**
 * Clear all authentication data
 */
const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};

/**
 * Refresh the access token using refresh token
 */
const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        saveTokens(data.accessToken);
        return data.accessToken;
    } catch (error) {
        clearAuth();
        window.location.href = '/login';
        throw error;
    }
};

/**
 * Helper function for API requests with automatic token refresh
 * @param {string} endpoint - API endpoint (e.g., '/login')
 * @param {object} options - fetch options (method, body, etc.)
 * @param {boolean} requiresAuth - Whether this request requires authentication
 * @returns {Promise<Response>}
 */
async function apiFetch(endpoint, options = {}, requiresAuth = false) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Add Authorization header if authentication is required or token is available
    if (requiresAuth || getAccessToken()) {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Stringify body if it's an object
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If token expired, try to refresh and retry
    if (response.status === 401 && requiresAuth) {
        try {
            const errorData = await response.json();
            
            if (errorData.code === 'TOKEN_EXPIRED') {
                // Refresh the token
                const newToken = await refreshAccessToken();
                
                // Retry the original request with new token
                config.headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            }
        } catch (error) {
            // If refresh fails, redirect to login
            clearAuth();
            window.location.href = '/login';
            throw error;
        }
    }

    return response;
}

/**
 * Helper function for authenticated API requests
 * Automatically adds Authorization header
 */
async function authenticatedFetch(endpoint, options = {}) {
    return apiFetch(endpoint, options, true);
}

export { 
    API_BASE_URL, 
    apiFetch, 
    authenticatedFetch,
    getAccessToken,
    getRefreshToken,
    saveTokens,
    clearAuth
};
