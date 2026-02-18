import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.onConnectCallback = null;
        this.onDisconnectCallback = null;
    }

    connect(onConnect = null, onDisconnect = null) {
        if (this.socket?.connected) {
            if (onConnect) onConnect();
            return;
        }

        this.onConnectCallback = onConnect;
        this.onDisconnectCallback = onDisconnect;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            if (this.onConnectCallback) this.onConnectCallback();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (this.onDisconnectCallback) this.onDisconnectCallback();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }

    onActiveUsersUpdate(callback) {
        if (!this.socket) {
            this.connect();
        }
        this.socket.on('active-users-update', callback);
    }

    offActiveUsersUpdate(callback) {
        if (this.socket) {
            this.socket.off('active-users-update', callback);
        }
    }
}

const socketService = new SocketService();
export default socketService;
