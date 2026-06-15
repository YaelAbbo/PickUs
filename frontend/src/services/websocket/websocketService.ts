import { BASE_URL } from '@constants';
import { io, type Socket } from 'socket.io-client';
import { WsEvent } from './events';

function getWsUrl(): string {
  return BASE_URL.replace(/\/api\/?$/, '');
}

const WS_PATH = '/api/socket.io';

class WebSocketService {
  private socket: Socket | null = null;
  private activeRooms = new Set<string>();
  private listeners = new Map<WsEvent, Set<(...args: unknown[]) => void>>();

  connect(accessToken: string): void {
    if (this.socket?.connected) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(getWsUrl(), {
      path: WS_PATH,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    // Re-register all listeners on the new socket instance
    this.listeners.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id);
      // Rejoin any active rooms upon connect/reconnect
      this.activeRooms.forEach((rideId) => {
        this.socket?.emit(WsEvent.ROOM_JOIN, rideId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.activeRooms.clear();
  }

  joinRoom(rideId: string): void {
    this.activeRooms.add(rideId);
    if (this.socket?.connected) {
      this.socket.emit(WsEvent.ROOM_JOIN, rideId);
    }
  }

  leaveRoom(rideId: string): void {
    this.activeRooms.delete(rideId);
    if (this.socket?.connected) {
      this.socket.emit(WsEvent.ROOM_LEAVE, rideId);
    }
  }

  emit<T = void>(event: WsEvent, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('[WS] Socket is not initialized'));
        return;
      }
      this.socket.emit(event, data, (response: T) => resolve(response));
    });
  }

  on<T = unknown>(event: WsEvent, handler: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(handler as (...args: unknown[]) => void);

    // Register handler to current socket if initialized
    this.socket?.on(event, handler as (...args: unknown[]) => void);

    return () => {
      handlers.delete(handler as (...args: unknown[]) => void);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
      this.socket?.off(event, handler as (...args: unknown[]) => void);
    };
  }

  off(event: WsEvent, handler: (...args: unknown[]) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
    this.socket?.off(event, handler);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
