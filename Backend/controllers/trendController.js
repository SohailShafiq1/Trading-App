import Trend from "../models/Trend.js";

export const getCurrentTrend = async (req, res) => {
  try {
    const trend = await Trend.findOne().sort({ updatedAt: -1 });
    res.json({ mode: trend ? trend.mode : "Normal" });
  } catch (err) {
    console.error("Error fetching trend:", err);
    res.status(500).json({ message: "Failed to fetch trend" });
  }
};

export const updateTrend = async (req, res) => {
  try {
    const { mode } = req.body;
    if (
      ![
        "Up",
        "Down",
        "Normal",
        "Scenario1",
        "Scenario2",
        "Scenario3",
        "Scenario4",
        "Scenario5",
      ].includes(mode)
    ) {
      return res.status(400).json({ message: "Invalid trend mode" });
    }

    await Trend.create({ mode });
    res.json({ message: "Trend updated successfully" });
  } catch (err) {
    console.error("Error updating trend:", err);
    res.status(500).json({ message: "Failed to update trend" });
  }
};
