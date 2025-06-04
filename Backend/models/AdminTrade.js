import mongoose from "mongoose";

const AdminTradeSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The admin who opened the trade
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The user for whom the trade is opened
    userEmail: { type: String, required: true },
    type: { type: String, enum: ["Buy", "Sell"], required: true },
    coin: { type: String, required: true },
    coinType: { type: String, required: true },
    investment: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    result: { type: String, default: "pending" },
    reward: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("AdminTrade", AdminTradeSchema);