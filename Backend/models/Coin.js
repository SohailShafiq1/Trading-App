import mongoose from "mongoose";

const coinSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "Live" or "OTC"
  name: { type: String, required: function () { return this.type === "Live"; } },
  firstName: { type: String, required: function () { return this.type === "OTC"; } },
  lastName: { type: String, required: function () { return this.type === "OTC"; } },
  startingPrice: { type: Number, required: function () { return this.type === "OTC"; } },
  profitPercentage: { type: Number, required: true },
});

export default mongoose.model("Coin", coinSchema);