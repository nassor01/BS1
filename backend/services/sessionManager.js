const activeSessions = new Map();
let io = null;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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

    removeSession(userId) {
        activeSessions.delete(userId);
        this.emitUpdate();
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
