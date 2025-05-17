import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import depositRoutes from "./routes/depositRoutes.js";

// Services
import candleService from "./services/candleGenerator.js";
import { checkTrc20Deposits } from "./utils/tronWatcher.js"; // ✅ Correct location

dotenv.config();

// App setup
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection
connectDB();

// REST API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/users", userRoutes);
app.use("/api/deposits", depositRoutes);

// WebSocket connections
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start real-time candle/tick service
candleService.initSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Start TRC20 auto-check every 30 seconds
setInterval(checkTrc20Deposits, 30000);
