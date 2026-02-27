const activeSessions = new Map();
const invalidatedTokens = new Set();
let io = null;

// Session timeout - should match JWT expiration (24 hours for users, 2h for admins)
// Using 2 hours to match admin JWT expiration as the minimum
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

const sessionManager = {
    setSocketIO(socketIO) {
        io = socketIO;
    },

    addSession(userId, userData) {
        activeSessions.set(userId, {
            ...userData,
            loginTime: new Date(),
            lastActivity: new Date()
        });
        this.emitUpdate();
    },

    removeSession(userId, token = null) {
        activeSessions.delete(userId);
        // If a token is provided, add it to the blacklist to invalidate it
        if (token) {
            invalidatedTokens.add(token);
        }
        this.emitUpdate();
    },

    /**
     * Check if a token has been invalidated
     */
    isTokenInvalidated(token) {
        return invalidatedTokens.has(token);
    },

    /**
     * Invalidate a specific token (for admin-initiated disconnects)
     */
    invalidateToken(token) {
        invalidatedTokens.add(token);
    },

    updateActivity(userId) {
        const session = activeSessions.get(userId);
        if (session) {
            session.lastActivity = new Date();
        }
    },

    getActiveSessions() {
        return Array.from(activeSessions.values()).map(session => ({
            id: session.userId,
            userId: session.userId,
            email: session.email,
            fullName: session.fullName,
            role: session.role,
            loginTime: session.loginTime,
            lastActivity: session.lastActivity,
            status: 'Active'
        }));
    },

    // Get all sessions with user IDs (for working hours enforcement)
    getAllSessions() {
        const sessions = [];
        for (const [userId, session] of activeSessions.entries()) {
            sessions.push({
                userId,
                email: session.email,
                role: session.role,
                fullName: session.fullName,
                loginTime: session.loginTime,
                lastActivity: session.lastActivity
            });
        }
        return sessions;
    },

    cleanupExpiredSessions() {
        const now = new Date();
        for (const [userId, session] of activeSessions.entries()) {
            if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
                activeSessions.delete(userId);
            }
        }
        if (activeSessions.size > 0) {
            this.emitUpdate();
        }
    },

    emitUpdate() {
        if (io) {
            const activeUsers = this.getActiveSessions();
            io.emit('active-users-update', activeUsers);
        }
    }
};

setInterval(() => {
    sessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);

module.exports = sessionManager;
