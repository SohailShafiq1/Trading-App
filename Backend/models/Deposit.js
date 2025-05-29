import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  txId: { type: String },
  status: {
    type: String,
    enum: ["pending", "verified", "failed"],
    default: "pending",
  },
  network: { type: String, default: "TRC20" },
  wallet: { type: String },
  createdAt: { type: Date, default: Date.now },
  fromAddress: { type: String },
  bonusPercent: { type: Number, default: 0 },
  bonusAmount: { type: Number, default: 0 },
  bonusiD: { type: String, default: null },
});

export default mongoose.model("Deposit", depositSchema);
