import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import candleGenerator from "./services/candleGenerator.js";
import trendRoutes from "./routes/trendRoutes.js";

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

const startServer = async () => {
  try {
    await connectDB();
    await candleGenerator.initialize();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
