// config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("♻️ Reusing existing MongoDB connection");
    return;
  }
  
  try {
    const env = process.env.DB_ENV || "atlas";
    const mongoUri = process.env.MONGODB_URI_LOCAL;

    if (!mongoUri)
      throw new Error(
        `Missing ${env === "local" ? "MONGODB_URI_LOCAL" : "MONGODB_URI"} in env`
      );

    await mongoose.connect(mongoUri, clientOptions);
    isConnected = true;
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      isConnected = false;
    });
    
    console.log("✅ MongoDB connection established");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    isConnected = false;
    throw error;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    console.log("📴 MongoDB already disconnected");
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("🔌 MongoDB disconnected gracefully");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error);
  }
};
