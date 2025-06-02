import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  withdrawAutoApproveLimit: { type: Number, default: 0 },
});

export default mongoose.model("Settings", SettingsSchema);
