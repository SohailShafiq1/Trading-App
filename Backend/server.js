import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import candleGenerator from "./services/candleGenerator.js";
import trendRoutes from "./routes/trendRoutes.js";
import webSocketService from "./services/websocket.js";

dotenv.config();

const app = express();

const allowedOrigins = ["http://localhost:5173"];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/trend", trendRoutes);

// Create HTTP server
const server = createServer(app);

// WebSocket upgrade handler
server.on("upgrade", (request, socket, head) => {
  const pathname = request.url;

  if (
    pathname.startsWith("/price") ||
    pathname.startsWith("/candles") ||
    pathname.startsWith("/trend")
  ) {
    webSocketService.wss.handleUpgrade(request, socket, head, (ws) => {
      webSocketService.wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

const startServer = async () => {
  try {
    await connectDB();
    await candleGenerator.initialize();
    webSocketService.initialize(server);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🛰️  WebSocket server running on ws://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
