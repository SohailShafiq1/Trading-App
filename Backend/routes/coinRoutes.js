import express from "express";
import Coin from "../models/Coin.js";
import { getCoinPrice, getCandleData } from "../controllers/coinController.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const coins = await Coin.find();
    res.json(coins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coins" });
  }
});

router.get("/price/:name", async (req, res) => {
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
});

router.get("/type/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const coin = await Coin.findOne({ name });
    if (!coin) {
      return res.status(404).json({ message: "Coin not found" });
    }
    res.json(coin.type);
  } catch (err) {
    console.error("Error fetching coin:", err);
    res.status(500).json({ message: "Failed to fetch coin" });
  }
});

router.post("/", async (req, res) => {
  const { type, name, firstName, lastName, startingPrice, profitPercentage } =
    req.body;

  try {
    const newCoin = new Coin({
      type,
      name,
      firstName,
      lastName,
      startingPrice,
      profitPercentage,
    });
    if (newCoin.type === "OTC") {
      newCoin.name = newCoin.firstName + "-" + newCoin.lastName;
    }
    await newCoin.save();
    const coins = await Coin.find();
    res.status(201).json(coins);
  } catch (err) {
    res.status(500).json({ message: "Failed to add coin" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, name, firstName, lastName, startingPrice, profitPercentage } =
    req.body;

  try {
    const updatedCoin = await Coin.findByIdAndUpdate(
      id,
      {
        type,
        name,
        firstName,
        lastName,
        startingPrice,
        profitPercentage,
      },
      { new: true }
    );

    if (!updatedCoin) {
      return res.status(404).json({ message: "Coin not found" });
    }

    const coins = await Coin.find();
    res.json(coins);
  } catch (err) {
    console.error("Error updating coin:", err);
    res.status(500).json({ message: "Failed to update coin" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Coin.findByIdAndDelete(id);
    const coins = await Coin.find();
    res.json(coins);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete coin" });
  }
});

router.put("/interval/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const { interval } = req.body;

    // Validate inputs more strictly
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid coin name",
      });
    }

    if (!["30s", "1m", "2m", "3m", "5m"].includes(interval)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interval value",
      });
    }

    const coin = await Coin.findOne({ name: name.trim() });
    if (!coin) {
      return res.status(404).json({
        success: false,
        message: "Coin not found",
      });
    }

    // Only update if interval is different
    if (coin.selectedInterval !== interval) {
      coin.selectedInterval = interval;
      await coin.save();
    }

    res.json({
      success: true,
      message: "Interval updated successfully",
      coin,
    });
  } catch (err) {
    console.error("Error updating interval:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

router.get("/candles/:name", getCandleData);

export default router;
