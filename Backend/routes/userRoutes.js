import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import Tesseract from "tesseract.js";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "profilePicture") {
      cb(null, "uploads/profile/");
    } else if (file.fieldname === "cnicPicture") {
      cb(null, "uploads/cnic/");
    } else {
      cb(null, "uploads/others/");
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const router = express.Router();

// Middleware
router.use(express.json());

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
  const { email, amount, txId, bonusPercent = 0 } = req.body;

  try {
    // Calculate bonus amount
    let bonusAmount = 0;
    if (bonusPercent) {
      bonusAmount = Math.floor((Number(amount) * Number(bonusPercent)) / 100);
    }

    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId,
      wallet: process.env.ADMIN_TRON_WALLET,
      bonusPercent,
      bonusAmount,
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

// Get user by ID (for admin view)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
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

    // Calculate total balance (assets + totalBonus)
    const totalBalance =
      typeof user.assets === "number" && typeof user.totalBonus === "number"
        ? (user.assets + user.totalBonus).toFixed(2)
        : "0.00";

    res.status(200).json({
      message: "Assets updated successfully",
      user,
      totalBalance, // <-- This is the sum of assets and bonus
    });
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
    const { email, trade } = req.body;
    if (!email || !trade) {
      return res.status(400).json({ error: "Missing email or trade data" });
    }

    const { investment } = trade;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalAvailable = user.assets + user.totalBonus;
    if (investment > totalAvailable) {
      return res.status(400).json({
        error: "Insufficient funds",
        currentBalance: totalAvailable,
        required: investment,
      });
    }

    // Deduct from assets first, then bonus if needed
    let assetsToDeduct = Math.min(user.assets, investment);
    let bonusToDeduct = investment - assetsToDeduct;

    user.assets -= assetsToDeduct;
    if (bonusToDeduct > 0) {
      user.totalBonus -= bonusToDeduct;
    }

    const newTrade = {
      ...trade,
      result: "pending",
      reward: 0,
      createdAt: new Date(),
    };

    user.trades.push(newTrade);
    await user.save();

    return res.status(201).json({
      message: "Trade saved successfully",
      trade: newTrade,
      newBalance: user.assets + user.totalBonus,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save trade" });
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
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "cnicPicture", maxCount: 1 },
  ]),
  async (req, res) => {
    const { email, firstName, lastName, dateOfBirth, cnicNumber } = req.body;
    const update = { firstName, lastName, cnicNumber };

    if (dateOfBirth && dateOfBirth !== "") {
      update.dateOfBirth = new Date(dateOfBirth);
    }
    if (req.files?.profilePicture) {
      update.profilePicture = `uploads/profile/${req.files.profilePicture[0].filename}`;
    }
    if (req.files?.cnicPicture) {
      const cnicImagePath = `uploads/cnic/${req.files.cnicPicture[0].filename}`;
      update.cnicPicture = cnicImagePath;

      // OCR extraction
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(cnicImagePath, "eng", {
          logger: (m) => console.log(m),
        });
        // Regex for Pakistani CNIC (13 digits, with or without dashes)
        const match = text.match(/(\d{5}-\d{7}-\d{1})|(\d{13})/);
        if (match) {
          update.imgCNIC = match[0];
        } else {
          update.imgCNIC = "";
        }
      } catch (ocrErr) {
        update.imgCNIC = "";
      }

      // === Place this check here ===
      if (
        update.imgCNIC &&
        req.body.cnicNumber &&
        update.imgCNIC !== req.body.cnicNumber
      ) {
        return res.status(400).json({ error: "Image not matched" });
      }
    }
    if (
      typeof req.body.profilePicture === "string" &&
      req.body.profilePicture === ""
    ) {
      update.profilePicture = "";
    }
    if (
      typeof req.body.cnicPicture === "string" &&
      req.body.cnicPicture === ""
    ) {
      update.cnicPicture = "";
      update.imgCNIC = ""; // <-- This line ensures the CNIC image number is also removed
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
