import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
const router = express.Router();

// Middleware
router.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    // Renamed unused parameters to avoid warnings
    cb(null, "bucket/"); // Save to 'bucket' folder in backend root
  },
  filename: function (_req, file, cb) {
    // Renamed unused parameter to avoid warnings
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Health check endpoint
router.get("/health", async (_req, res) => {
  // Renamed unused parameter to avoid warnings
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({
      status: "healthy",
      dbState: mongoose.connection.readyState,
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      dbState: mongoose.connection.readyState,
      error: err.message,
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
    res
      .status(201)
      .json({ message: "Deposit submitted, awaiting confirmation." });
  } catch (err) {
    console.error("Error creating deposit:", err);
    res.status(500).json({ error: "Failed to create deposit." });
  }
});

// Get all registered users
router.get("/", async (_req, res) => {
  // Renamed unused parameter to avoid warnings
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
  const { email, amount, network, purse, paymentMethod } = req.body; // Removed unused 'purse'

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
      paymentMethod: `${paymentMethod} (${network})`, // Fixed template literal syntax
      status: "pending", // 'status' here is not related to the deprecated Window.status
      date: new Date(),
    });

    user.withdrawals.push({
      // 'user' is correctly defined in the context
      orderId,
      amount,
      purse,
      network,
      paymentMethod,
      status: "pending",
      createdAt: new Date(),
    });

    user.assets -= amount; // 'user' is correctly defined in the context
    await user.save(); // 'user' is correctly defined in the context

    res.status(201).json({ message: "Withdrawal submitted" });
  } catch (err) {
    console.error("Error processing withdrawal:", err);
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

// Save user trade
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
        received: req.body,
      });
    }

    const { type, coin, investment, entryPrice, startedAt, duration } = trade;

    const requiredFields = [
      "type",
      "coin",
      "investment",
      "entryPrice",
      "startedAt",
      "duration",
    ];
    const missingFields = requiredFields.filter((field) => !trade[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required trade fields",
        missingFields,
      });
    }

    if (isNaN(investment) || investment <= 0) {
      return res
        .status(400)
        .json({ error: "Investment must be a positive number" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.assets < investment) {
      return res.status(400).json({
        error: "Insufficient funds",
        currentBalance: user.assets,
        required: investment,
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
      createdAt: new Date(),
    };

    user.assets -= investment;
    user.trades.push(newTrade);

    await user.save();

    console.log("Trade saved successfully:", newTrade);

    return res.status(201).json({
      message: "Trade saved successfully",
      trade: newTrade,
      newBalance: user.assets,
    });
  } catch (err) {
    console.error("Error saving trade:", {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });
    return res.status(500).json({
      error: "Failed to save trade",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// Update trade result
router.put("/trade/result", async (req, res) => {
  try {
    const { email, startedAt, result, reward, exitPrice } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tradeIndex = user.trades.findIndex(
      (t) =>
        t.startedAt &&
        new Date(t.startedAt).getTime() === new Date(startedAt).getTime()
    );

    if (tradeIndex === -1) {
      return res.status(404).json({ error: "Trade not found" });
    }

    user.trades[tradeIndex].result = result;
    user.trades[tradeIndex].reward = reward;
    user.trades[tradeIndex].exitPrice = exitPrice;

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    let profitChange = 0;
    if (result === "win") {
      profitChange = reward;
    } else if (result === "loss") {
      profitChange = -user.trades[tradeIndex].investment;
    }

    // Find today's profit entry
    let dailyEntry = user.dailyProfits.find((p) => p.date === today);
    if (dailyEntry) {
      dailyEntry.profit += profitChange;
    } else {
      user.dailyProfits.push({ date: today, profit: profitChange });
    }

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
      .filter((trade) => trade.startedAt && trade.duration)
      .map((trade) => ({
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

// Update user profile (firstName, lastName)
router.put(
  "/update-profile",
  upload.single("profilePicture"),
  async (req, res) => {
    const { email, firstName, lastName, dateOfBirth } = req.body;
    const update = { firstName, lastName };
    if (dateOfBirth && dateOfBirth !== "") {
      update.dateOfBirth = new Date(dateOfBirth);
    }
    if (req.file) {
      update.profilePicture = `bucket/${req.file.filename}`; // Fixed template literal syntax
    }
    try {
      const user = await User.findOneAndUpdate({ email }, update, {
        new: true,
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.status(200).json({ message: "Profile updated successfully", user });
    } catch (err) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// Verify user by admin
router.put("/verify/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User verified", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// Unverify user by admin
router.put("/unverify/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verified: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User unverified", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to unverify user" });
  }
});

router.get("/is-verified/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(id, { verified: 1 });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ verified: user.verified });
  } catch (err) {
    console.error("Error checking verification status:", err);
    res.status(500).json({ error: "Failed to check verification status" });
  }
});

export default router;
