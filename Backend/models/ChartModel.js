import mongoose from "mongoose";

const CandleSchema = new mongoose.Schema({
  x: { type: Number, required: true }, // timestamp
  y: { type: [Number], required: true }, // [open, high, low, close]
  trend: { type: String, required: true }, // trend when generated
  duration: { type: Number, required: true }, // candle duration in ms
});

const ChartSchema = new mongoose.Schema({
  coinName: { type: String, required: true, unique: true },
  candles: { type: [CandleSchema], default: [] },
  currentTrend: { type: String, default: "Normal" },
  currentDuration: { type: Number, default: 30000 }, // 30s default
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model("Chart", ChartSchema);
