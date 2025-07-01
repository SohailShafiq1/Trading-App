// config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;                 // reuse if already open
  const env = process.env.DB_ENV || "atlas";
  const mongoUri =
    env === "local"
      ? process.env.MONGODB_URI_LOCAL
      : process.env.MONGODB_URI;

  if (!mongoUri)
    throw new Error(
      `Missing ${env === "local" ? "MONGODB_URI_LOCAL" : "MONGODB_URI"} in env`
    );

  await mongoose.connect(mongoUri, clientOptions);
  isConnected = true;
  console.log("✅ MongoDB connected");
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("🔌 MongoDB disconnected");
};
