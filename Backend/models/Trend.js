import mongoose from "mongoose";

const trendSchema = new mongoose.Schema({
  mode: {
    type: String,
    required: true,
    enum: ["Up", "Down", "Normal", "Scenario1", "Scenario2", "Scenario3", "Scenario4", "Scenario5"],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Trend = mongoose.model("Trend", trendSchema);

export default Trend;
