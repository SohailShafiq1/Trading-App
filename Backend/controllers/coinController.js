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
    const { interval = "30s", limit = 100 } = req.query;

    const coin = await Coin.findOne({ name });
    if (!coin) {
      return res.status(404).json({ message: "Coin not found" });
    }

    const filteredCandles = coin.candles
      .filter((c) => c.interval === interval)
      .sort((a, b) => b.time - a.time)
      .slice(0, parseInt(limit));

    res.json(filteredCandles);
  } catch (err) {
    console.error("Error fetching candles:", err);
    res.status(500).json({ message: "Failed to fetch candles" });
  }
};
