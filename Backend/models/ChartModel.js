import mongoose from "mongoose";

const CandleSchema = new mongoose.Schema({
  x: Number,
  y: [Number],
});

const ChartSchema = new mongoose.Schema({
  coinName: { type: String, required: true, unique: true },
  candles: [CandleSchema],
});

export default mongoose.model("Chart", ChartSchema);
