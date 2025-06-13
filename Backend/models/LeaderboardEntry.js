import mongoose from "mongoose";

const LeaderboardEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: String,
  email: String,
  country: String,
  todayProfit: { type: Number, default: 0 },
  tradesCount: { type: Number, default: 0 },
  profitableTrades: { type: Number, default: 0 },
  date: { type: String, required: true },
});
export default mongoose.model("LeaderboardEntry", LeaderboardEntrySchema);
