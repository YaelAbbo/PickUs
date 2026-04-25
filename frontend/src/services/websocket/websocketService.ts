import { BASE_URL } from '@constants';
import { io, type Socket } from 'socket.io-client';

function getWsUrl(): string {
  return BASE_URL.replace(/\/api\/?$/, '');
}

const WS_PATH = '/api/socket.io';

class WebSocketService {
  private socket: Socket | null = null;

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

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id);
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
  }

  emit<T = void>(event: string, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('[WS] Socket is not connected'));
        return;
      }
      this.socket.emit(event, data, (response: T) => resolve(response));
    });
  }

  on<T = unknown>(event: string, handler: (data: T) => void): () => void {
    this.socket?.on(event, handler as (...args: unknown[]) => void);
    return () => this.socket?.off(event, handler as (...args: unknown[]) => void);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.socket?.off(event, handler);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
