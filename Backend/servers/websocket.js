import WebSocket from "ws";
import { candleGenerator } from "../services/candleGenerator.js";

export const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  // Subscribe to candle updates
  const unsubscribe = candleGenerator.subscribe((coinName, candle) => {
    const message = JSON.stringify({ coinName, candle });

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  wss.on("connection", (ws) => {
    ws.on("close", () => {
      unsubscribe();
    });
  });

  return wss;
};
