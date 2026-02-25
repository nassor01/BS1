// Central API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Read the CSRF token from the cookie set by the backend.
 * The backend sets `csrf_token` via the setCsrfToken middleware.
 * This cookie is NOT HttpOnly so JS can read it (double-submit cookie pattern).
 */
const getCsrfCookie = () => {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

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
        saveTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
    } catch (error) {
        clearAuth();
        window.location.href = '/login';
        throw error;
    }
};

/**
 * Helper function for API requests with automatic token refresh.
 * Also attaches CSRF token (from cookie) on all state-changing requests.
 *
 * @param {string} endpoint - API endpoint (e.g., '/login')
 * @param {object} options - fetch options (method, body, etc.)
 * @param {boolean} requiresAuth - Whether this request requires authentication
 * @returns {Promise<Response>}
 */
async function apiFetch(endpoint, options = {}, requiresAuth = false) {
    const method = (options.method || 'GET').toUpperCase();
    const isStateMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Attach CSRF token for all state-changing requests (double-submit cookie pattern).
    // The backend sends the cookie via setCsrfToken middleware; we read and echo it back.
    if (isStateMutating) {
        const csrfToken = getCsrfCookie();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }

    // Only attach JWT if authentication is explicitly required
    if (requiresAuth) {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Stringify objects and arrays (but not strings or FormData)
    if (config.body && typeof config.body === 'object' && !(config.body instanceof String) && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401 && requiresAuth) {
        console.log('=== 401 Unauthorized detected ===');
        try {
            // Clone before reading to avoid "body already read" errors downstream
            const cloned = response.clone();
            const errorData = await cloned.json();

            if (errorData.code === 'TOKEN_EXPIRED') {
                console.log('Token expired, attempting refresh...');
                const newToken = await refreshAccessToken();
                config.headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            }
        } catch (error) {
            console.error('Token refresh failed, redirecting to login:', error);
            clearAuth();
            window.location.href = '/login';
            throw error;
        }
    }

    // Handle working hours restriction.
    // Clone response before reading body so it's still consumable by the caller.
    if (response.status === 403) {
        try {
            const cloned = response.clone();
            const errorData = await cloned.json();
            if (errorData.code === 'OUTSIDE_WORKING_HOURS') {
                clearAuth();
                sessionStorage.setItem('workingHoursError', errorData.error);
                window.location.href = '/login';
                return response;
            }
        } catch (error) {
            // Continue if we can't parse error — do NOT redirect for other 403s
        }
    }

    return response;
}

/**
 * Helper function for authenticated API requests.
 * Automatically adds Authorization header and CSRF token.
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
    clearAuth,
    getCsrfCookie
};
