import mongoose from "mongoose";

const bonusSchema = new mongoose.Schema({
  min: { type: Number, required: true },
  percent: { type: Number, required: true },
});

export default mongoose.model("Bonus", bonusSchema);