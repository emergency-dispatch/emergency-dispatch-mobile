import { AppConfig } from '../constants/config';
import { storage } from './storage';

type Handler = (payload: any) => void;

const RECORD_SEP = '\x1e';

function getHubBaseUrl(): string {
  return AppConfig.API_BASE_URL.replace(/\/api\/?$/, '');
}

/**
 * Lightweight ASP.NET Core SignalR JSON Hub client over React Native WebSocket.
 * No external dependencies required.
 */
class NativeSignalRClient {
  private hubPath: string;
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private reconnectHandlers = new Set<() => void>();
  private startPromise: Promise<boolean> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyStopped = false;
  private hasConnectedBefore = false;
  private invocationCounter = 1;
  private buffer = '';
  private pendingInvocations: Array<{ target: string; args: any[] }> = [];

  constructor(hubPath: string) {
    this.hubPath = hubPath;
  }

  public start(): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(true);
    }
    if (this.startPromise) return this.startPromise;

    this.manuallyStopped = false;
    this.startPromise = this.connectInternal().finally(() => {
      this.startPromise = null;
    });
    return this.startPromise;
  }

  private async connectInternal(): Promise<boolean> {
    const token = await storage.getItem<string>(AppConfig.STORAGE_KEYS.AUTH_TOKEN).catch(() => null);
    if (!token) return false;

    const baseHttp = getHubBaseUrl();
    const negotiateUrl = `${baseHttp}${this.hubPath}/negotiate?negotiateVersion=1`;

    let connectionToken = '';
    try {
      const res = await fetch(negotiateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        connectionToken = data?.connectionToken || data?.connectionId || '';
      }
    } catch {
      return false;
    }

    const wsBase = baseHttp.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    const params = new URLSearchParams();
    if (connectionToken) params.set('id', connectionToken);
    params.set('access_token', token);
    const wsUrl = `${wsBase}${this.hubPath}?${params.toString()}`;

    return new Promise<boolean>((resolve) => {
      let settled = false;
      try {
        const socket = new WebSocket(wsUrl);
        this.ws = socket;

        socket.onopen = () => {
          this.buffer = '';
          socket.send(JSON.stringify({ protocol: 'json', version: 1 }) + RECORD_SEP);
          this.startKeepAlive();
          while (this.pendingInvocations.length > 0) {
            const item = this.pendingInvocations.shift()!;
            this.sendInvokeFrame(item.target, item.args);
          }
          if (this.hasConnectedBefore) {
            this.reconnectHandlers.forEach((cb) => {
              try {
                cb();
              } catch {
                // ignore
              }
            });
          }
          this.hasConnectedBefore = true;
          if (!settled) {
            settled = true;
            resolve(true);
          }
        };

        socket.onmessage = (event) => {
          const chunk = typeof event.data === 'string' ? event.data : '';
          if (!chunk) return;
          this.buffer += chunk;
          const parts = this.buffer.split(RECORD_SEP);
          this.buffer = parts.pop() || '';
          for (const raw of parts) {
            const trimmed = raw.trim();
            if (!trimmed) continue;
            try {
              const frame = JSON.parse(trimmed);
              if (frame?.type === 1 && typeof frame.target === 'string') {
                const key = frame.target.toLowerCase();
                const payload = Array.isArray(frame.arguments) ? frame.arguments[0] : undefined;
                this.handlers.get(key)?.forEach((cb) => {
                  try {
                    cb(payload);
                  } catch {
                    // ignore
                  }
                });
              }
            } catch {
              // ignore handshake/malformed frame
            }
          }
        };

        socket.onerror = () => {
          if (!settled) {
            settled = true;
            resolve(false);
          }
        };

        socket.onclose = () => {
          this.stopKeepAlive();
          if (this.ws === socket) {
            this.ws = null;
          }
          if (!settled) {
            settled = true;
            resolve(false);
          }
          if (!this.manuallyStopped) {
            this.scheduleReconnect();
          }
        };
      } catch {
        if (!settled) resolve(false);
      }
    });
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 6 }) + RECORD_SEP);
        } catch {
          // ignore
        }
      }
    }, 15000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.handlers.size === 0) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manuallyStopped) {
        void this.start();
      }
    }, 3000);
  }

  private sendInvokeFrame(target: string, args: any[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const frame = {
      type: 1,
      invocationId: String(this.invocationCounter++),
      target,
      arguments: args,
    };
    this.ws.send(JSON.stringify(frame) + RECORD_SEP);
  }

  public async invoke(target: string, ...args: any[]): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendInvokeFrame(target, args);
      return;
    }
    this.pendingInvocations.push({ target, args });
    await this.start();
  }

  public on(eventName: string, handler: Handler): () => void {
    const key = eventName.toLowerCase();
    const set = this.handlers.get(key) || new Set<Handler>();
    set.add(handler);
    this.handlers.set(key, set);
    return () => {
      const current = this.handlers.get(key);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.handlers.delete(key);
      }
    };
  }

  public onReconnected(handler: () => void): () => void {
    this.reconnectHandlers.add(handler);
    return () => {
      this.reconnectHandlers.delete(handler);
    };
  }

  public stop(): void {
    this.manuallyStopped = true;
    this.stopKeepAlive();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingInvocations = [];
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }
}

export const mobileTrackingHub = new NativeSignalRClient('/hubs/tracking');
export const mobileIncidentHub = new NativeSignalRClient('/hubs/incidents');

export const MobileHubEvents = {
  ReceiveRescueUnitLocation: 'ReceiveRescueUnitLocation',
  ReceiveAssignmentStatus: 'ReceiveAssignmentStatus',
  ReceiveIncidentStatus: 'ReceiveIncidentStatus',
  ReceiveIncidentUpdate: 'ReceiveIncidentUpdate',
  ReceiveNotification: 'ReceiveNotification',
  ReceiveCitizenMapChanged: 'ReceiveCitizenMapChanged',
} as const;
