import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isOnline = navigator.onLine;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(API_BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    this.setupInternalListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupInternalListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', this.socket.id);
      this.isOnline = true;
      
      // Trigger any registered global connect listeners
      this._notifyListeners('connection:status', { status: 'connected' });
      
      // Try to sync offline updates if any exist
      this.triggerOfflineSync();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Socket disconnected:', reason);
      this.isOnline = false;
      this._notifyListeners('connection:status', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.isOnline = false;
    });

    // Listen to network status changes to manually manage socket
    window.addEventListener('online', () => {
      console.log('Network online, attempting socket reconnect...');
      this.isOnline = true;
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Network offline.');
      this.isOnline = false;
    });
  }

  // General publish/subscribe mechanism
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      // Only register with socket.io once per event string
      if (this.socket) {
        this.socket.on(event, (data) => this._notifyListeners(event, data));
      }
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
        if (this.socket) {
          this.socket.off(event);
        }
      }
    }
  }

  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  emit(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`[Socket Offline] Cannot emit event ${event}. Queuing for later sync if applicable.`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  triggerOfflineSync() {
    // Basic offline queue processing logic
    // We will expand on this when setting up the syncService
    const offlineQueue = JSON.parse(localStorage.getItem('sync_queue_offline') || '[]');
    if (offlineQueue.length > 0 && this.socket?.connected) {
      console.log(`Syncing ${offlineQueue.length} offline actions...`);
      this.socket.emit('sync:offline_updates', offlineQueue);
      // Backend will process and return sync:acknowledge
    }
  }
}

export const socketService = new SocketService();
export default socketService;
