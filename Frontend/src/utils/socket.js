// socketService.js

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(
      import.meta.env.VITE_BACKEND_URL.replace(/^http/, "ws") + "/ws"
    );

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onopen = () => {
      console.log("WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.listeners.get(data.type) || [];
        handlers.forEach((handler) => handler(data));
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
    };
  }

  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
    return () => this.removeListener(type, callback);
  }

  removeListener(type, callback) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      handlers.filter((handler) => handler !== callback)
    );
  }
}

export const socketService = new SocketService();
