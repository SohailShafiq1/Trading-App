import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const COIN_FILE = path.resolve("data/coins.json");

// Helper to read coins from file
const readCoins = () => {
  const data = fs.readFileSync(COIN_FILE, "utf-8");
  return JSON.parse(data);
};

// Helper to write coins to file
const writeCoins = (coins) => {
  fs.writeFileSync(COIN_FILE, JSON.stringify(coins, null, 2), "utf-8");
};

// Get all coins
router.get("/", (req, res) => {
  const coins = readCoins();
  res.status(200).json(coins);
});

// Add a new coin
router.post("/", (req, res) => {
  const { name, type, startingPrice } = req.body;
  if (!name || !type || (type === "OTC" && startingPrice === undefined)) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const coins = readCoins();
  if (coins.some((coin) => coin.name === name)) {
    return res.status(400).json({ error: "Coin already exists" });
  }

  const newCoin = { name, type };
  if (type === "OTC") newCoin.startingPrice = startingPrice;

  coins.push(newCoin);
  writeCoins(coins);
  res.status(201).json({ message: "Coin added successfully", coins });
});

// Delete a coin
router.delete("/:name", (req, res) => {
  const { name } = req.params;
  let coins = readCoins();

  const coinIndex = coins.findIndex((coin) => coin.name === name);
  if (coinIndex === -1) {
    return res.status(404).json({ error: "Coin not found" });
  }

  coins.splice(coinIndex, 1);
  writeCoins(coins);
  res.status(200).json({ message: "Coin deleted successfully", coins });
});

export default router;
