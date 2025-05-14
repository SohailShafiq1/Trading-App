import Coin from "../models/Coin.js";

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
    const newCoin = new Coin({
      ...req.body,
      name:
        req.body.type === "OTC"
          ? `${req.body.firstName}-${req.body.lastName}`
          : req.body.name,
      selectedInterval: "30s",
    });
    await newCoin.save();
    res.status(201).json(await Coin.find());
  } catch {
    res.status(500).json({ message: "Failed to add coin" });
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
    const limit = parseInt(req.query.limit) || 200;
    console.log(
      `Fetching candles for ${name} with interval ${interval} and limit ${limit}`
    );

    const coin = await Coin.findOne({ name });
    if (!coin) return res.status(404).json({ message: "Coin not found" });

    const candles = coin.candles
      .filter((c) => c.interval === interval)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .slice(-limit);

    res.json(candles);
  } catch (err) {
    console.error("Failed to fetch candles:", err);
    res.status(500).json({ message: "Failed to fetch candles" });
  }
};
