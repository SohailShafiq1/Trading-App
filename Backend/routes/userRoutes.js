import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import Tesseract from "tesseract.js";
import fs from "fs";

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

router.use(express.json());

router.get("/health", async (_req, res) => {
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

router.post("/deposit", async (req, res) => {
  const { email, amount, txId, bonusId, bonusPercent = 0 } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (Number(amount) < 10) {
      return res.status(400).json({ error: "Minimum deposit amount is $10" });
    }

    let bonusAmount = 0;
    if (bonusPercent && bonusPercent > 0) {
      bonusAmount = (Number(amount) * Number(bonusPercent)) / 100;

      if (bonusId && user.usedBonuses.includes(bonusId)) {
        return res
          .status(400)
          .json({ error: "This bonus has already been used" });
      }
    }

    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId: txId || "Pending",
      wallet: process.env.ADMIN_TRON_WALLET,
      bonusPercent: bonusPercent || 0,
      bonusAmount,
      bonusId: bonusId || null,
      status: "pending",
    });

    await deposit.save();

    if (bonusId && bonusPercent > 0) {
      user.usedBonuses.push(bonusId);
      await user.save();
    }

    res.status(201).json({
      message: "Deposit submitted, awaiting confirmation.",
      deposit,
      user: {
        usedBonuses: user.usedBonuses,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create deposit." });
  }
});

router.get("/", async (_req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/update-assets", async (req, res) => {
  const { email, assets } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { assets },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalBalance =
      typeof user.assets === "number" && typeof user.totalBonus === "number"
        ? (user.assets + user.totalBonus).toFixed(2)
        : "0.00";

    res.status(200).json({
      message: "Assets updated successfully",
      user,
      totalBalance,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update assets" });
  }
});

router.post("/withdraw", async (req, res) => {
  const { email, amount, network, purse, paymentMethod } = req.body;

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

router.get("/transactions/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, { transactions: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user.transactions || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

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
      calculatedReward: 0,
      status: "running",
      canClose: false,
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

router.put("/trade/result", async (req, res) => {
  try {
    const { email, startedAt, result, calculatedReward, exitPrice } = req.body;

    if (!email || !startedAt || !result) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["email", "startedAt", "result"],
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const tradeIndex = user.trades.findIndex(
      (t) =>
        t.startedAt &&
        Math.abs(
          new Date(t.startedAt).getTime() - new Date(startedAt).getTime()
        ) < 1000
    );

    if (tradeIndex === -1) {
      return res.status(404).json({
        error: "Trade not found",
        details: `No trade found with startedAt: ${startedAt}`,
      });
    }

    if (!["can_close", "win", "loss"].includes(result)) {
      return res.status(400).json({
        error: "Invalid result value",
        allowedValues: ["can_close", "win", "loss"],
      });
    }

    const trade = user.trades[tradeIndex];

    if (result === "can_close") {
      trade.result = "can_close";
      trade.calculatedReward = calculatedReward || 0;
      trade.exitPrice = exitPrice || trade.entryPrice;
      trade.status = "can_close";
      trade.canClose = true;
    } else if (result === "win" || result === "loss") {
      trade.result = result;
      trade.reward = calculatedReward || 0;
      trade.exitPrice = exitPrice || trade.entryPrice;
      trade.status = result;
      trade.canClose = false;

      if (result === "win") {
        user.assets += Number(calculatedReward) || 0;
      }

      const today = new Date().toISOString().slice(0, 10);
      const profitChange =
        result === "win" ? Number(calculatedReward) || 0 : -trade.investment;

      let dailyEntry = user.dailyProfits.find((p) => p.date === today);
      if (dailyEntry) {
        dailyEntry.profit += profitChange;
      } else {
        user.dailyProfits.push({ date: today, profit: profitChange });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Trade result updated successfully",
      updatedTrade: trade,
      newBalance: user.assets + user.totalBonus,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to update trade result",
      details: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

router.get("/trades/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const processedTrades = user.trades.map((trade) => ({
      id: trade._id,
      type: trade.type,
      coin: trade.coin,
      coinType: trade.coinType,
      investment: trade.investment,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || trade.entryPrice,
      result: trade.result,
      reward: trade.reward,
      calculatedReward: trade.calculatedReward,
      status: trade.status,
      canClose: trade.canClose,
      startedAt: trade.startedAt,
      duration: trade.duration,
      remainingTime:
        trade.remainingTime ||
        (trade.startedAt && trade.duration
          ? Math.max(
              0,
              trade.duration -
                Math.floor((new Date() - new Date(trade.startedAt)) / 1000)
            )
          : 0),
      createdAt: trade.createdAt,
    }));

    res.status(200).json(processedTrades.reverse());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});
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

      try {
        const {
          data: { text },
        } = await Tesseract.recognize(cnicImagePath, "eng", {
          logger: (m) => {},
        });
        const match = text.match(/(\d{5}-\d{7}-\d{1})|(\d{13})/);
        if (match) {
          update.imgCNIC = match[0];
        } else {
          update.imgCNIC = "";
        }
      } catch (ocrErr) {
        update.imgCNIC = "";
      }

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
      update.imgCNIC = "";
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
    res.status(500).json({ error: "Failed to check verification status" });
  }
});

router.post("/validate-cnic", async (req, res) => {
  const { cnicNumber } = req.body;

  if (!cnicNumber) {
    return res.status(400).json({ error: "CNIC number is required" });
  }

  if (cnicNumber && !/^\d{5}-\d{7}-\d{1}$/.test(cnicNumber)) {
    return res.status(400).json({ error: "Invalid CNIC format" });
  }

  try {
    const existingUser = await User.findOne({ cnicNumber });
    if (existingUser) {
      return res.status(409).json({ error: "CNIC number already exists" });
    }

    res.status(200).json({ message: "CNIC number is valid" });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate CNIC" });
  }
});

export default router;
