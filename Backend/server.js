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
import { checkTrc20Deposits } from "./utils/tronWatcher.js";
import depositRoutes from './routes/depositRoutes.js';
// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Allowed frontend origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

// CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/users", userRoutes);
app.use('/api/users', depositRoutes); 
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
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

setInterval(checkTrc20Deposits, 30000);