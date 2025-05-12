import Coin from "../models/Coin.js";

export const getCoinPrice = async (req, res) => {
  try {
    const { name } = req.params;
    const coin = await Coin.findOne({ name });
    if (!coin) {
      return res.status(404).json({ message: "Coin not found" });
    }
    res.json({ price: coin.currentPrice });
  } catch (err) {
    console.error("Error fetching coin:", err);
    res.status(500).json({ message: "Failed to fetch coin" });
  }
};

export const getCandleData = async (req, res) => {
  try {
    const { name } = req.params;
    const { interval = "30s", limit = 200 } = req.query;

    const coin = await Coin.findOne({ name });
    if (!coin) {
      return res.status(404).json({ message: "Coin not found" });
    }

    // Get complete candles only (excluding the current incomplete candle)
    const now = new Date();
    const intervalMs =
      {
        "30s": 30000,
        "1m": 60000,
        "2m": 120000,
        "3m": 180000,
        "5m": 300000,
      }[interval] || 30000;

    const lastCompleteTime = new Date(
      Math.floor(now.getTime() / intervalMs) * intervalMs - intervalMs
    );

    const filteredCandles = coin.candles
      .filter(
        (c) => c.interval === interval && new Date(c.time) <= lastCompleteTime
      )
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, parseInt(limit));

    res.json(filteredCandles);
  } catch (err) {
    console.error("Error fetching candles:", err);
    res.status(500).json({ message: "Failed to fetch candles" });
  }
};
