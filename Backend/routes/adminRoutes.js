import express from "express";

const router = express.Router();

let currentTrend = "Normal"; // Default trend

// Endpoint to update the trend
router.post("/trend", (req, res) => {
  const { mode } = req.body;
  if (!mode) {
    return res.status(400).json({ error: "Mode is required" });
  }
  currentTrend = mode;
  res
    .status(200)
    .json({ message: "Trend updated successfully", trend: currentTrend });
});

// Endpoint to fetch the current trend
router.get("/trend", (req, res) => {
  res.status(200).json({ trend: currentTrend });
});

export default router;
