import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB, disconnectDB } from "./config/db.js";
import path from "path";
import morgan from "morgan";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import depositRoutes from "./routes/depositRoutes.js";
import affiliateRoutes from "./routes/affiliateRoutes.js";
import bonusRoutes from "./routes/bonusRoutes.js";
import newsRoutes from "./routes/newsRoute.js";
import settingsRoutes from "./routes/settings.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";

// Services
import candleService from "./services/candleGenerator.js";
// import { checkTrc20Deposits } from "./utils/tronWatcher.js"; // TRC-20 API commented out
import AffiliateTimers from "./utils/affiliateTimers.js";
import "./utils/affiliateCron.js"; // Start affiliate cron job

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Configure CORS
const allowedOrigins = [
  "https://wealthx-broker.com",
  "https://api.wealthx-broker.com",
  "https://wealthx1.netlify.app",
  "http://localhost:5173", // Added for local dev
  // Add more origins as needed
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// Middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/bucket", express.static(path.join(process.cwd(), "bucket")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(
  "/uploads/support",
  express.static(path.join(process.cwd(), "uploads", "support"))
);
// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/users", userRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/bonuses", bonusRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/leaderboard", leaderboardRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/testimonials", testimonialRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  res.status(500).json({
    error: {
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

// Initialize Affiliate Timers Service
const affiliateTimers = new AffiliateTimers(io);

// Track connected sockets for cleanup
const connectedSockets = new Set();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  connectedSockets.add(socket);

  // Handle affiliate timer registration
  socket.on("registerAffiliate", (email) => {
    if (email) {
      affiliateTimers.handleConnection(socket, email);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected (${reason}): ${socket.id}`);
    connectedSockets.delete(socket);
  });

  socket.on("error", (err) => {
    console.error(`⚠️ Socket error (${socket.id}):`, err);
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // Initialize services
    await candleService.initSocket(io);
    affiliateTimers.initialize();
    console.log("📊 Services initialized");

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, '0.0.0.0',() => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌍 Allowed origins: ${allowedOrigins.join(", ")}`);
    });

    // Start background services
    // setInterval(checkTrc20Deposits, 30000); // TRC-20 deposit checker commented out
    // console.log("🔍 TRC20 deposit checker started"); // TRC-20 deposit checker commented out
  } catch (err) {
    console.error("💥 Failed to start server:", err);
    process.exit(1);
  }
};

// Start the application
startServer();

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received. Shutting down gracefully...`);
  
  try {
    // Stop accepting new connections
    httpServer.close(() => {
      console.log("💤 HTTP Server closed");
    });

    // Close all socket connections
    connectedSockets.forEach(socket => {
      socket.disconnect(true);
    });
    connectedSockets.clear();

    // Stop affiliate timers
    if (affiliateTimers) {
      affiliateTimers.cleanup();
    }

    // Disconnect from database
    await disconnectDB();
    
    console.log("💤 Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("� Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
