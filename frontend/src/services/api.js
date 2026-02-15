// Central API configuration
const API_BASE_URL = 'http://localhost:3000';

/**
 * Helper function for API requests
 * @param {string} endpoint - API endpoint (e.g., '/login')
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
async function apiFetch(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Stringify body if it's an object
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return response;
}

export { API_BASE_URL, apiFetch };
