import mongoose from "mongoose";

const candleSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  interval: {
    type: String,
    enum: ["30s", "1m", "2m", "3m", "5m"],
    required: true,
  },
});

const coinSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Live", "OTC"],
    },
    name: {
      type: String,
      required: function () {
        return this.type === "Live";
      },
    },
    firstName: {
      type: String,
      required: function () {
        return this.type === "OTC";
      },
    },
    lastName: {
      type: String,
      required: function () {
        return this.type === "OTC";
      },
    },
    startingPrice: {
      type: Number,
      required: function () {
        return this.type === "OTC";
      },
    },
    profitPercentage: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      default: function () {
        return this.type === "OTC" ? this.startingPrice : 100;
      },
    },
    candles: {
      type: [candleSchema],
      default: [],
    },
    trend: {
      type: String,
      enum: [
        "Random",
        "Up",
        "Down",
        "Scenario1",
        "Scenario2",
        "Scenario3",
        "Scenario4",
        "Scenario5",
      ],
      default: "Random",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

coinSchema.index({ name: 1, type: 1 });
coinSchema.index({ "candles.time": 1, "candles.interval": 1 });

export default mongoose.model("Coin", coinSchema);
