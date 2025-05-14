import { WebSocketServer } from "ws";
import candleGenerator from "./candleGenerator.js";
import Coin from "../models/Coin.js";

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on("connection", (ws, req) => {
      const pathname = req.url;
      const [_, type, identifier, interval] = pathname.split("/");

      this.handleConnection(type, identifier, interval, ws);
    });

    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });

    console.log("WebSocket server initialized");
    return this;
  }

  handleConnection(type, identifier, interval, ws) {
    const connectionKey = `${type}-${identifier}-${interval || ""}`.replace(
      /-$/,
      ""
    );

    // Add metadata to the WebSocket object
    ws.metadata = { type, identifier, interval, connectionKey };

    switch (type) {
      case "price":
        this.handlePriceConnection(identifier, ws);
        break;
      case "candles":
        this.handleCandlesConnection(identifier, interval, ws);
        break;
      case "trend":
        this.handleTrendConnection(ws);
        break;
      default:
        ws.close(1003, "Unsupported WebSocket endpoint");
    }

    ws.on("close", () => {
      console.log(`Connection closed: ${connectionKey}`);
      this.connections.delete(connectionKey);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error (${connectionKey}):`, error);
      this.connections.delete(connectionKey);
    });
  }

  async handlePriceConnection(identifier, ws) {
    const key = `price-${identifier}`;
    this.connections.set(key, ws);
    console.log(`New price connection: ${key}`);

    try {
      const currentPrice =
        candleGenerator.priceHistory.get(identifier) ||
        (await Coin.findOne({ name: identifier }))?.currentPrice ||
        100;
      this.sendToConnection(key, currentPrice.toString());
    } catch (err) {
      console.error("Error getting initial price:", err);
    }
  }

  async handleCandlesConnection(identifier, interval, ws) {
    const key = `candles-${identifier}-${interval}`;
    this.connections.set(key, ws);
    console.log(`New candles connection: ${key}`);

    try {
      const coin = await Coin.findOne({ name: identifier });
      if (coin?.candles) {
        const filteredCandles = interval
          ? coin.candles.filter((c) => c.interval === interval)
          : coin.candles;
        this.sendToConnection(key, JSON.stringify(filteredCandles));
      }
    } catch (err) {
      console.error("Error fetching initial candles:", err);
    }
  }

  handleTrendConnection(ws) {
    const key = "trend-global";
    this.connections.set(key, ws);
    console.log(`New trend connection: ${key}`);

    candleGenerator
      .getCurrentTrend()
      .then((trend) => this.sendToConnection(key, trend))
      .catch((err) => console.error("Error getting trend:", err));
  }

  sendToConnection(key, message) {
    const ws = this.connections.get(key);
    if (ws && ws.readyState === 1) {
      // 1 = OPEN state
      try {
        ws.send(message);
      } catch (err) {
        console.error("Error sending WebSocket message:", err);
        this.connections.delete(key);
      }
    }
  }

  broadcastTo(type, identifier, message, interval = "") {
    const key = `${type}-${identifier}-${interval}`.replace(/-$/, "");
    this.sendToConnection(key, message);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
