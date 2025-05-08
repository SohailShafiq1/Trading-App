import ChartModel from "../models/ChartModel.js";

export const saveChartData = async (req, res) => {
  const { coinName, chartData, trend, duration } = req.body;

  try {
    let chart = await ChartModel.findOne({ coinName });
    if (chart) {
      chart.candles = chartData;
      chart.trend = trend;
      chart.duration = duration;
      await chart.save();
    } else {
      chart = new ChartModel({
        coinName,
        candles: chartData,
        trend,
        duration,
      });
      await chart.save();
    }

    res.status(200).json({ message: "Chart data saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCandles = async (req, res) => {
  try {
    const { coinName } = req.params;
    const chart = await ChartModel.findOne({ coinName });

    if (!chart) return res.status(404).json({ message: "No data found" });

    res.status(200).json({
      candles: chart.candles,
      duration: chart.duration,
      trend: chart.trend,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching candles" });
  }
};
