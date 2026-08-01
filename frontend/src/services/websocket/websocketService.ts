import { BASE_URL } from '@constants';
import { io, type Socket } from 'socket.io-client';
import { WsEvent } from './events';

function getWsUrl(): string {
  return BASE_URL.replace(/\/api\/?$/, '');
}

const WS_PATH = '/api/socket.io';

class WebSocketService {
  private socket: Socket | null = null;
  private joinedRideRooms = new Set<string>();
  private connectionChangeListeners = new Set<(connected: boolean) => void>();
  private eventListeners = new Map<WsEvent, Set<(...args: unknown[]) => void>>();

  connect(accessToken: string): void {
    if (this.socket?.connected) return;

    this.socket = io(getWsUrl(), {
      path: WS_PATH,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    // Re-register all persistent event listeners on the new socket
    this.eventListeners.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id);
      this.notifyConnectionListeners(true);

      // Auto-rejoin rooms on reconnect
      this.joinedRideRooms.forEach((rideId) => {
        if (this.socket?.connected) {
          this.socket.emit(WsEvent.ROOM_JOIN, rideId);
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.joinedRideRooms.clear();
    this.notifyConnectionListeners(false);
  }

  emit<T = void>(event: WsEvent, data?: unknown): Promise<T> {
    if (event === WsEvent.ROOM_JOIN && typeof data === 'string') {
      this.joinedRideRooms.add(data);
    } else if (event === WsEvent.ROOM_LEAVE && typeof data === 'string') {
      this.joinedRideRooms.delete(data);
    }

    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        // For fire-and-forget event emits or room tracking when disconnected,
        // resolve cleanly or catch gracefully rather than throwing unhandled rejections.
        if (event === WsEvent.ROOM_JOIN || event === WsEvent.ROOM_LEAVE || event === WsEvent.LOCATION_UPDATE) {
          resolve(undefined as unknown as T);
          return;
        }
        reject(new Error('[WS] Socket is not connected'));
        return;
      }
      this.socket.emit(event, data, (response: T) => resolve(response));
    });
  }

  on<T = unknown>(event: WsEvent, handler: (data: T) => void): () => void {
    const castedHandler = handler as (...args: unknown[]) => void;
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(castedHandler);

    this.socket?.on(event, castedHandler);

    return () => {
      this.eventListeners.get(event)?.delete(castedHandler);
      this.socket?.off(event, castedHandler);
    };
  }

  off(event: WsEvent, handler: (...args: unknown[]) => void): void {
    const castedHandler = handler as (...args: unknown[]) => void;
    this.eventListeners.get(event)?.delete(castedHandler);
    this.socket?.off(event, castedHandler);
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionChangeListeners.add(listener);
    return () => this.connectionChangeListeners.delete(listener);
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionChangeListeners.forEach((listener) => listener(connected));
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
