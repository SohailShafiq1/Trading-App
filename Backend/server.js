import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chartRoutes from "./routes/chartRoutes.js";
import { checkTrc20Deposits } from "./utils/tronWatcher.js"; // ✅ Make sure this file exists

// ✅ Load env vars before using them
dotenv.config();

// ✅ Initialize express app
const app = express();

// ✅ CORS config
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

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chart", chartRoutes);

// ✅ DB Connection
connectDB();

// ✅ Periodic TRC20 deposit watcher (every 30 seconds)
setInterval(checkTrc20Deposits, 30000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
