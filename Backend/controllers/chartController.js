import ChartModel from "../models/ChartModel.js";

export const saveChartData = async (req, res) => {
  try {
    const { coinName, candles } = req.body;

    await ChartModel.findOneAndUpdate(
      { coinName },
      { $set: { candles } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Candles saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving candles" });
  }
};

export const getCandles = async (req, res) => {
  try {
    const { coinName } = req.params;
    const chart = await ChartModel.findOne({ coinName });

    if (!chart) return res.status(404).json({ message: "No data found" });

    res.status(200).json(chart.candles);
  } catch (error) {
    res.status(500).json({ error: "Error fetching candles" });
  }
};
