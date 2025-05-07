import ChartModel from "../models/ChartModel.js";
import { candleGenerator } from "../services/candleGenerator.js";

export const getCoinChart = async (req, res) => {
  try {
    const { coinName } = req.params;
    const chart = await ChartModel.findOne({ coinName });

    if (!chart) {
      return res.status(404).json({ message: "Coin not found" });
    }

    res.json({
      candles: chart.candles,
      currentTrend: chart.currentTrend,
      currentDuration: chart.currentDuration,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
};

export const updateDuration = async (req, res) => {
  try {
    const { coinName, duration } = req.body;

    await ChartModel.findOneAndUpdate(
      { coinName },
      { currentDuration: duration }
    );

    // Update in generator
    const chart = await ChartModel.findOne({ coinName });
    if (chart && chart.candles.length > 0) {
      candleGenerator.activeCoins.set(coinName, {
        lastCandle: chart.candles[chart.candles.length - 1],
        duration,
        trend: chart.currentTrend,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update duration" });
  }
};

export const addNewCoin = async (req, res) => {
  try {
    const { coinName } = req.body;
    await candleGenerator.addCoin(coinName);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add new coin" });
  }
};
