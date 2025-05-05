import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import testPassword from "./test/testfile.js";
import adminRoutes from "./routes/adminRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
dotenv.config();

const app = express();

const allowedOrigins = ["http://localhost:5173"]; // Add your frontend URL here

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coins", coinRoutes);
connectDB();
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
