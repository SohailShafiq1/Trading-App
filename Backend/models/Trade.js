import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    coinName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    reward: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["running", "win", "loss"],
      default: "running",
    },
    remainingTime: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Trade", TradeSchema);