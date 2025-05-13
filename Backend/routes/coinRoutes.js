import express from "express";
import Coin from "../models/Coin.js";
import candleGenerator from "../services/candleGenerator.js";
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
    res.json({ price: coin?.currentPrice || 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch price" });
  }
});

router.get("/type/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const coin = await Coin.findOne({ name });
    res.json(coin?.type || "");
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coin type" });
  }
});

router.get("/name/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const coin = await Coin.findOne({ name });
    res.json(coin || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coin" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newCoin = new Coin({
      ...req.body,
      selectedInterval: "30s",
    });
    if (newCoin.type === "OTC") {
      newCoin.name = `${newCoin.firstName}-${newCoin.lastName}`;
    }
    await newCoin.save();
    res.status(201).json(await Coin.find());
  } catch (err) {
    res.status(500).json({ message: "Failed to add coin" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedCoin = await Coin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(await Coin.find());
  } catch (err) {
    res.status(500).json({ message: "Failed to update coin" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Coin.findByIdAndDelete(req.params.id);
    res.json(await Coin.find());
  } catch (err) {
    res.status(500).json({ message: "Failed to delete coin" });
  }
});

router.put("/interval/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const { interval } = req.body;

    if (!["30s", "1m", "2m", "3m", "5m"].includes(interval)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid interval" });
    }

    const coin = await Coin.findOneAndUpdate(
      { name },
      { selectedInterval: interval },
      { new: true }
    );

    if (!coin) {
      return res
        .status(404)
        .json({ success: false, message: "Coin not found" });
    }

    await candleGenerator.updateCoinInterval(name, interval);
    res.json({ success: true, coin });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update interval" });
  }
});

router.get("/candles/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const { interval } = req.query;
    const coin = await Coin.findOne({ name });

    if (!coin) {
      return res.status(404).json({ message: "Coin not found" });
    }

    const candles = coin.candles.filter(
      (c) => !interval || c.interval === interval
    );
    res.json(candles);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch candles" });
  }
});

export default router;
