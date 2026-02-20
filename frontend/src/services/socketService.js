import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.onConnectCallback = null;
        this.onDisconnectCallback = null;
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 3;
        this.isConnecting = false;
    }

    connect(onConnect = null, onDisconnect = null) {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting || this.socket?.connected) {
            if (onConnect && this.socket?.connected) onConnect();
            return;
        }

        this.isConnecting = true;
        this.onConnectCallback = onConnect;
        this.onDisconnectCallback = onDisconnect;

        try {
            this.socket = io(SOCKET_URL, {
                transports: ['polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectionAttempts,
                reconnectionDelay: 3000,
                timeout: 15000,
                forceNew: true
            });

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket.id);
                this.reconnectionAttempts = 0;
                this.isConnecting = false;
                if (this.onConnectCallback) this.onConnectCallback();
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                this.isConnecting = false;
                if (this.onDisconnectCallback) this.onDisconnectCallback();
            });

            this.socket.on('connect_error', (error) => {
                this.reconnectionAttempts++;
                this.isConnecting = false;
                console.warn('Socket connection error:', error.message);
                if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
                    console.warn('Socket connection failed. Server may be unavailable.');
                }
            });

            this.socket.on('disconnect', () => {
                this.isConnecting = false;
            });
        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.isConnecting = false;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnecting = false;
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }

    onActiveUsersUpdate(callback) {
        if (!this.socket?.connected) {
            this.connect();
        }
        this.socket?.on('active-users-update', callback);
    }

    offActiveUsersUpdate(callback) {
        if (this.socket) {
            this.socket.off('active-users-update', callback);
        }
    }

    onRoomCreated(callback) {
        if (!this.socket?.connected) {
            this.connect();
        }
        this.socket?.on('room-created', callback);
    }

    offRoomCreated(callback) {
        if (this.socket) {
            this.socket.off('room-created', callback);
        }
    }

    onRoomDeleted(callback) {
        if (!this.socket?.connected) {
            this.connect();
        }
        this.socket?.on('room-deleted', callback);
    }

    offRoomDeleted(callback) {
        if (this.socket) {
            this.socket.off('room-deleted', callback);
        }
    }
}

const socketService = new SocketService();
export default socketService;
