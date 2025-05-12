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
    res.json(coin.startingPrice);
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

// Update a coin
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
      { new: true } // Return the updated document
    );

    if (!updatedCoin) {
      return res.status(404).json({ message: "Coin not found" });
    }

    const coins = await Coin.find(); // Fetch all coins after updating
    res.json(coins);
  } catch (err) {
    console.error("Error updating coin:", err);
    res.status(500).json({ message: "Failed to update coin" });
  }
});

// Delete a coin
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
router.get("/candles/:name", getCandleData);

export default router;
