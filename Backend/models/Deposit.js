import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  txId: { type: String }, // User can optionally submit this
  status: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
  network: { type: String, default: 'TRC20' },
  wallet: { type: String }, // Admin's wallet address (receiver)
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Deposit", depositSchema);
