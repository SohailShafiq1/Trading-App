import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Buy", "Sell"],
      required: true,
    },
    coin: {
      type: String,
      required: true,
    },
    coinType: {
      type: String,
      enum: ["Live", "OTC"],
      required: true,
    },
    investment: {
      type: Number,
      required: true,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    exitPrice: {
      type: Number,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    result: {
      type: String,
    },
    reward: {
      type: Number,
      default: 0,
    },
    calculatedReward: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
    },
    canClose: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual for remaining time
TradeSchema.virtual("remainingTime").get(function () {
  if (this.result !== "pending" && this.result !== "running") return 0;
  if (!this.startedAt || !this.duration) return this.duration || 0;

  const elapsed = Math.floor((new Date() - this.startedAt) / 1000);
  return Math.max(0, this.duration - elapsed);
});

export default mongoose.model("Trade", TradeSchema);
