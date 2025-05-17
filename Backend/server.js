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
import candleService from "./services/candleGenerator.js";
import { checkTrc20Deposits } from "./utils/tronWatcher.js";
import affiliateRoutes from "./routes/affiliateRoutes.js";

dotenv.config();

// Initialize express app
const app = express();

// Allowed frontend origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:5173"];

// CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", depositRoutes);
app.use("/api/affiliate", affiliateRoutes);

// Create HTTP server for socket.io
const httpServer = createServer(app);

// Initialize socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start the server
const startServer = async () => {
  try {
    await connectDB();
    candleService.initSocket(io); // Initialize WebSocket in generator

    const PORT = process.env.PORT;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
// Check TRC20 deposits periodically
setInterval(checkTrc20Deposits, 30000);
