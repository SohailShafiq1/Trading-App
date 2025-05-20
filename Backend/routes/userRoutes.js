import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import mongoose from "mongoose";  
const router = express.Router(); 

// Middleware
router.use(express.json());

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({
      status: "healthy",
      dbState: mongoose.connection.readyState,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      dbState: mongoose.connection.readyState,
      error: err.message
    });
  }
});

// User Deposit Route
router.post("/deposit", async (req, res) => {
  const { email, amount, txId } = req.body;

  try {
    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId,
      wallet: process.env.ADMIN_TRON_WALLET,
    });

    await deposit.save();
    res.status(201).json({ message: "Deposit submitted, awaiting confirmation." });
  } catch (err) {
    console.error("Error creating deposit:", err);
    res.status(500).json({ error: "Failed to create deposit." });
  }
});

// Get all registered users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by email
router.get("/email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user by email:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user assets
router.put("/update-assets", async (req, res) => {
  const { email, assets } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { assets },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "Assets updated successfully", user });
  } catch (err) {
    console.error("Error updating assets:", err);
    res.status(500).json({ error: "Failed to update assets" });
  }
});

// User Withdrawal Route
router.post("/withdraw", async (req, res) => {
  const { email, amount, purse, network, paymentMethod } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.assets < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    const orderId = Math.floor(100000 + Math.random() * 900000).toString();

    user.transactions.push({
      orderId,
      type: "withdrawal",
      amount,
      paymentMethod: `${paymentMethod} (${network})`,
      status: "pending",
      date: new Date(),
    });

    user.withdrawals.push({
      orderId,
      amount,
      purse,
      network,
      paymentMethod,
      status: "pending",
      createdAt: new Date(),
    });

    user.assets -= amount;
    await user.save();

    res.status(201).json({ message: "Withdrawal submitted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

// Get all user transactions
router.get("/transactions/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, { transactions: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user.transactions || []);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Save user trade (development version without transactions)
router.post("/trade", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }

  try {
    console.log("Incoming trade request:", req.body);
    
    const { email, trade } = req.body;
    
    if (!email || !trade) {
      return res.status(400).json({ 
        error: "Missing email or trade data",
        received: req.body 
      });
    }

    const { type, coin, investment, entryPrice, startedAt, duration } = trade;
    
    const requiredFields = ['type', 'coin', 'investment', 'entryPrice', 'startedAt', 'duration'];
    const missingFields = requiredFields.filter(field => !trade[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required trade fields",
        missingFields
      });
    }

    if (isNaN(investment) || investment <= 0) {
      return res.status(400).json({ error: "Investment must be a positive number" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.assets < investment) {
      return res.status(400).json({ 
        error: "Insufficient funds",
        currentBalance: user.assets,
        required: investment
      });
    }

    const newTrade = {
      type,
      coin,
      investment,
      entryPrice,
      startedAt: new Date(startedAt),
      duration,
      result: "pending",
      reward: 0,
      createdAt: new Date()
    };

    user.assets -= investment;
    user.trades.push(newTrade);

    await user.save();
    
    console.log("Trade saved successfully:", newTrade);
    
    return res.status(201).json({ 
      message: "Trade saved successfully",
      trade: newTrade,
      newBalance: user.assets
    });

  } catch (err) {
    console.error("Error saving trade:", {
      error: err.message,
      stack: err.stack,
      body: req.body
    });
    return res.status(500).json({ 
      error: "Failed to save trade",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update trade result (development version without transactions)
router.put("/trade/result", async (req, res) => {
  try {
    const { email, startedAt, result, reward, exitPrice } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tradeIndex = user.trades.findIndex(
      (t) => t.startedAt && new Date(t.startedAt).getTime() === new Date(startedAt).getTime()
    );

    if (tradeIndex === -1) {
      return res.status(404).json({ error: "Trade not found" });
    }

    user.trades[tradeIndex].result = result;
    user.trades[tradeIndex].reward = reward;
    user.trades[tradeIndex].exitPrice = exitPrice;

    if (result === "win") {
      user.assets += reward;
    }

    await user.save();

    res.status(200).json({ message: "Trade result updated", user });
  } catch (err) {
    console.error("Error updating trade result:", err);
    res.status(500).json({ error: "Failed to update trade result" });
  }
});

// Get user trades
router.get("/trades/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const validTrades = user.trades
      .filter(trade => trade.startedAt && trade.duration)
      .map(trade => ({
        ...trade.toObject(),
        startedAt: trade.startedAt.toISOString(),
        createdAt: trade.createdAt.toISOString(),
      }));

    res.status(200).json(validTrades.reverse());
  } catch (err) {
    console.error("Error fetching trades:", err);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});


export default router;