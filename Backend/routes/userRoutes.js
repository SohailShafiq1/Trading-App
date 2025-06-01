import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import Tesseract from "tesseract.js";
import fs from "fs";
import nodemailer from "nodemailer";
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "profilePicture") {
      cb(null, "uploads/profile/");
    } else if (
      file.fieldname === "cnicPicture" ||
      file.fieldname === "cnicBackPicture"
    ) {
      cb(null, "uploads/cnic/");
    } else if (file.fieldname === "passportImage") {
      cb(null, "uploads/passport/"); // <-- Add this
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

router.post("/deposit", async (req, res) => {
  const { email, amount, txId, bonusId, bonusPercent = 0 } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate amount
    if (Number(amount) < 10) {
      return res.status(400).json({ error: "Minimum deposit amount is $10" });
    }

    // Calculate bonus amount
    let bonusAmount = 0;
    if (bonusPercent && bonusPercent > 0) {
      bonusAmount = (Number(amount) * Number(bonusPercent)) / 100;

      // Verify bonus hasn't been used already
      if (bonusId && user.usedBonuses.includes(bonusId)) {
        return res
          .status(400)
          .json({ error: "This bonus has already been used" });
      }
    }

    // Create deposit and mark as verified immediately
    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId: txId || "Auto-Approved",
      wallet: process.env.ADMIN_TRON_WALLET,
      bonusPercent: bonusPercent || 0,
      bonusAmount,
      bonusId: bonusId || null,
      status: "verified", // <-- AUTO-APPROVE
    });

    await deposit.save();

    // Credit user immediately
    user.assets += Number(amount);
    user.depositCount = (user.depositCount || 0) + 1;
    user.transactions.push({
      orderId: deposit._id.toString(),
      type: "deposit",
      amount,
      paymentMethod: "TRC20 Wallet",
      status: "success",
      date: new Date(),
    });

    // Add bonus if any
    if (bonusAmount > 0) {
      user.totalBonus = (user.totalBonus || 0) + bonusAmount;
    }

    // Add bonus ID to user's usedBonuses if provided
    if (bonusId && bonusPercent > 0) {
      user.usedBonuses.push(bonusId);
    }

    await user.save();

    res.status(201).json({
      message: "Deposit auto-approved and credited.",
      deposit,
      user: {
        usedBonuses: user.usedBonuses,
      },
    });
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
      totalBalance: totalBalance, // <-- This is the sum of assets and bonus
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
    console.error("Error saving trade:", err);
    return res.status(500).json({ error: "Failed to save trade" });
  }
});

// Update trade result
router.put("/trade/result", async (req, res) => {
  try {
    const { email, startedAt, result, calculatedReward, exitPrice } = req.body;

    console.log("Received trade update request:", {
      email,
      startedAt,
      result,
      calculatedReward,
      exitPrice,
    });

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

    // Find the trade by startedAt time (this should be unique per user)
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

    // Validate result
    if (!["can_close", "win", "loss"].includes(result)) {
      return res.status(400).json({
        error: "Invalid result value",
        allowedValues: ["can_close", "win", "loss"],
      });
    }

    // Update trade based on result type
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

      // Only credit account when trade is actually closed (win)
      if (result === "win") {
        user.assets += Number(calculatedReward) || 0;
      }

      // Update daily profits
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

    console.log("Successfully updated trade:", {
      tradeId: trade._id,
      result: trade.result,
      reward: trade.reward,
      newBalance: user.assets + user.totalBonus,
    });

    res.status(200).json({
      success: true,
      message: "Trade result updated successfully",
      updatedTrade: trade,
      newBalance: user.assets + user.totalBonus,
    });
  } catch (err) {
    console.error("Error updating trade result:", {
      error: err.message,
      stack: err.stack,
      requestBody: req.body,
    });

    res.status(500).json({
      error: "Failed to update trade result",
      details: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

// Get user trades
router.get("/trades/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Process trades to include all necessary fields for frontend
    const processedTrades = user.trades.map((trade) => ({
      id: trade._id,
      type: trade.type,
      coin: trade.coin,
      coinType: trade.coinType,
      investment: trade.investment,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || trade.entryPrice, // Fallback to entryPrice if exitPrice is missing
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
    { name: "cnicBackPicture", maxCount: 1 },
    { name: "passportImage", maxCount: 1 }, // <-- Add this
  ]),
  async (req, res) => {
    const {
      email,
      firstName,
      lastName,
      dateOfBirth,
      cnicNumber,
      passportNumber,
    } = req.body;
    const update = { firstName, lastName, cnicNumber, passportNumber };

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
    if (req.files?.cnicBackPicture) {
      // Save to /uploads/cnic/
      const cnicBackImagePath = `uploads/cnic/${req.files.cnicBackPicture[0].filename}`;
      update.cnicBackPicture = cnicBackImagePath;
    }
    if (req.files?.passportImage) {
      update.passportImage = `/uploads/passport/${req.files.passportImage[0].filename}`;
    }
    if (req.body.passportNumber) {
      update.passportNumber = req.body.passportNumber;
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
      update.imgCNIC = ""; // Remove CNIC image number
    }
    if (
      typeof req.body.cnicBackPicture === "string" &&
      req.body.cnicBackPicture === ""
    ) {
      update.cnicBackPicture = "";
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

// Validate CNIC format
router.post("/validate-cnic", async (req, res) => {
  const { cnicNumber } = req.body;

  // Check if CNIC number is provided
  if (!cnicNumber) {
    return res.status(400).json({ error: "CNIC number is required" });
  }

  // Check if CNIC number matches the valid format
  if (cnicNumber && !/^\d{5}-\d{7}-\d{1}$/.test(cnicNumber)) {
    return res.status(400).json({ error: "Invalid CNIC format" });
  }

  try {
    // Check if the CNIC number already exists in the database
    const existingUser = await User.findOne({ cnicNumber });
    if (existingUser) {
      return res.status(409).json({ error: "CNIC number already exists" });
    }

    res.status(200).json({ message: "CNIC number is valid" });
  } catch (err) {
    console.error("Error validating CNIC:", err);
    res.status(500).json({ error: "Failed to validate CNIC" });
  }
});

// Block user by admin
router.put("/block/:id", async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { blocked: true, blockReason: reason },
    { new: true }
  );
  if (user) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Only for testing with self-signed certs
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Account Has Been Blocked",
      text: `Dear ${
        user.firstName || "User"
      },\n\nYour account has been blocked by the admin.\nReason: ${reason}\n\nIf you believe this is a mistake, please contact support.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Block email sent to", user.email);
      // Add this to track successful sends
      if (user) {
        user.lastEmailSent = new Date();
        await user.save();
      }
    } catch (error) {
      console.error("Error sending block email:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      // Consider storing the error for debugging
      if (user) {
        user.emailError = error.message;
        await user.save();
      }
    }
  }
  res.json({ success: true });
});

router.put("/unblock/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      blocked: false,
      blockReason: "",
    },
    { new: true }
  );
  if (user) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Congratulations! Your Account Has Been Unblocked",
      text: `Dear ${
        user.firstName || "User"
      },\n\nCongratulations! Our team has reviewed your account and it has been unblocked. You can now log in and continue using our services.\n\nIf you have any questions, please contact support.\n\nBest regards,\nSupport Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Unblock email sent to", user.email);
    } catch (error) {
      console.error("Error sending unblock email:", error);
    }
  }
  res.json({ success: true });
});

router.post("/test-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "Test Email",
      text: "This is a test email from your server.",
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response,
    });
  }
});
export default router;
