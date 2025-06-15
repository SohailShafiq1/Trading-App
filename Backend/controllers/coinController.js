import Coin from "../models/Coin.js";
import axios from "axios";

export const getAllCoins = async (_, res) => {
  try {
    const coins = await Coin.find();
    res.json(coins);
  } catch {
    res.status(500).json({ message: "Failed to fetch coins" });
  }
};

export const getCoinPrice = async (req, res) => {
  try {
    const coin = await Coin.findOne({ name: req.params.name });
    if (!coin) return res.status(404).json({ message: "Coin not found" });
    res.json({ price: coin.currentPrice });
  } catch {
    res.status(500).json({ message: "Failed to fetch price" });
  }
};

export const getCoinByName = async (req, res) => {
  try {
    const coin = await Coin.findOne({ name: req.params.name });
    res.json(coin || null);
  } catch {
    res.status(500).json({ message: "Failed to fetch coin" });
  }
};

export const createCoin = async (req, res) => {
  try {
    const {
      type,
      name,
      firstName,
      lastName,
      startingPrice,
      profitPercentage,
      trend,
    } = req.body;

    // Validate input
    if (type === "Live" && !name) {
      return res
        .status(400)
        .json({ message: "Name is required for Live coins" });
    }

    if (type === "OTC" && (!firstName || !lastName || !startingPrice)) {
      return res.status(400).json({
        message:
          "First name, last name, and starting price are required for OTC coins",
      });
    }

    const coinData = {
      type,
      profitPercentage,
      ...(type === "Live"
        ? {
            name,
            trend: undefined, // Live coins shouldn't have trends
          }
        : type === "OTC"
        ? {
            firstName,
            lastName,
            startingPrice,
            name: `${firstName}-${lastName}`,
            trend: trend || "Normal", // Default trend for OTC coins
            selectedInterval: "30s",
          }
        : {
            // Forex
            firstName,
            lastName,
            name: `${firstName}${lastName}`.toUpperCase(),
          }),
    };

    const newCoin = new Coin(coinData);
    await newCoin.save();

    res.status(201).json(await Coin.find());
  } catch (err) {
    console.error("Error adding coin:", err);

    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Coin with this name already exists" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((val) => val.message)
          .join(", "),
      });
    }

    res.status(500).json({
      message: "Failed to add coin",
      error: err.message,
    });
  }
};

export const updateCoin = async (req, res) => {
  try {
    await Coin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(await Coin.find());
  } catch {
    res.status(500).json({ message: "Failed to update coin" });
  }
};

export const deleteCoin = async (req, res) => {
  try {
    await Coin.findByIdAndDelete(req.params.id);
    res.json(await Coin.find());
  } catch {
    res.status(500).json({ message: "Failed to delete coin" });
  }
};

export const getCoinCandles = async (req, res) => {
  try {
    const { name, interval } = req.params;

    const coin = await Coin.findOne({ name });
    if (!coin) return res.status(404).json({ message: "Coin not found" });

    const candles = coin.candles
      .filter((c) => c.interval === "30s")
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    res.json(candles);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch candles" });
  }
};

export const updateCoinTrend = async (req, res) => {
  try {
    const { coinName, mode } = req.body;

    // Validate trend mode
    const validTrends = [
      "Up",
      "Down",
      "Random",
      "Scenario1",
      "Scenario2",
      "Scenario3",
      "Scenario4",
      "Scenario5",
    ];
    if (!validTrends.includes(mode)) {
      return res.status(400).json({ message: "Invalid trend mode" });
    }

    // Find and update the OTC coin
    const updatedCoin = await Coin.findOneAndUpdate(
      {
        $or: [
          { name: coinName, type: "OTC" },
          {
            $expr: {
              $eq: [{ $concat: ["$firstName", " ", "$lastName"] }, coinName],
            },
            type: "OTC",
          },
        ],
      },
      { trend: mode },
      { new: true }
    );

    if (!updatedCoin) {
      return res.status(404).json({ message: "OTC coin not found" });
    }

    res.json({
      success: true,
      coins: await Coin.find(),
      updatedCoin,
    });
  } catch (err) {
    console.error("Error updating coin trend:", err);
    res.status(500).json({
      message: "Failed to update coin trend",
      error: err.message,
    });
  }
};

export const updateAllCoinTrends = async (req, res) => {
  try {
    const { mode } = req.body;
    const validTrends = [
      "Up",
      "Down",
      "Random",
      "Scenario1",
      "Scenario2",
      "Scenario3",
      "Scenario4",
      "Scenario5",
    ];
    if (!validTrends.includes(mode)) {
      return res.status(400).json({ message: "Invalid trend mode" });
    }
    // Only update OTC coins
    const result = await Coin.updateMany(
      { type: "OTC" },
      { $set: { trend: mode } }
    );
    res.json({
      success: true,
      updatedCount: result.modifiedCount,
      coins: await Coin.find(),
    });
  } catch (err) {
    console.error("Error updating all coin trends:", err);
    res.status(500).json({
      message: "Failed to update all coin trends",
      error: err.message,
    });
  }
};

export const getCoinTypeByName = async (req, res) => {
  try {
    const { name } = req.params;
    const coin = await Coin.findOne({ name });
    if (!coin) {
      return res.status(404).json({ message: "Coin not found" });
    }
    res.json({ type: coin.type });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coin type" });
  }
};

// Fetch live Forex price from external API
export const getLiveForexPrice = async (req, res) => {
  try {
    const { pair } = req.params; // e.g., EURUSD
    // Use Twelve Data free demo endpoint (replace with your API key for production)
    const apiKey = process.env.TWELVE_DATA_API_KEY || "demo";
    const url = `https://api.twelvedata.com/price?symbol=${pair}&apikey=${apiKey}`;
    const response = await axios.get(url);
    if (response.data && response.data.price) {
      res.json({ price: Number(response.data.price) });
    } else {
      res.status(404).json({ message: "Forex pair not found or API error" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch live forex price",
      error: err.message,
    });
  }
};
