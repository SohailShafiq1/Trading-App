// models/ChartModel.js
import mongoose from "mongoose";

const candleSchema = new mongoose.Schema({
  x: { type: Date, required: true }, // or Number if using timestamps
  y: {
    type: [Number],
    required: true,
    validate: {
      validator: function (v) {
        return v.length === 4; // [open, high, low, close]
      },
      message: (props) =>
        `Candle data must have 4 values, got ${props.value.length}`,
    },
  },
});

const chartSchema = new mongoose.Schema({
  coinName: { type: String, required: true, unique: true },
  candles: [candleSchema],
  trend: { type: String, required: true },
  duration: { type: Number, required: true },
});

export default mongoose.model("Chart", chartSchema);
