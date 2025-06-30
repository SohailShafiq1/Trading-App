import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import Settings from "../models/Settings.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import Tesseract from "tesseract.js";
import fs from "fs";
import nodemailer from "nodemailer";
import { log } from "console";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
[
  "uploads/profile",
  "uploads/cnic",
  "uploads/support",
  "uploads/others",
].forEach(ensureDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "profilePicture") cb(null, "uploads/profile/");
    else if (
      file.fieldname === "cnicPicture" ||
      file.fieldname === "cnicBackPicture"
    )
      cb(null, "uploads/cnic/");
    else if (file.fieldname === "screenshots") cb(null, "uploads/support/");
    else cb(null, "uploads/others/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname)); // .jpg, .png, etc.
  },
});

export const supportUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

export const upload = multer({ storage });

// Health check
export const healthCheck = async (req, res) => {
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
};

// Deposit
export const createDeposit = async (req, res) => {
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
      status: "pending", // Always pending!
    });

    await deposit.save();

    // Do NOT credit user here. Only admin approval should do that.

    if (bonusId && bonusPercent > 0 && !user.usedBonuses.includes(bonusId)) {
      user.usedBonuses.push(bonusId);
      await user.save();
    }

    res.status(201).json({
      message: "Deposit submitted and pending admin approval.",
      deposit,
      user: {
        usedBonuses: user.usedBonuses,
      },
    });
  } catch (err) {
    console.error("Error creating deposit:", err);
    res.status(500).json({ error: "Failed to create deposit." });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user by email
export const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user by email:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user assets
export const updateUserAssets = async (req, res) => {
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
    console.error("Error updating assets:", err);
    res.status(500).json({ error: "Failed to update assets" });
  }
};

// Withdraw
export const withdraw = async (req, res) => {
  const { email, amount, network, purse, paymentMethod } = req.body;

  try {
    // Get auto-approve range from settings
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const limit = Number(settings.withdrawAutoApproveLimit);

    let status = "pending";
    let processedAt = undefined;

    if (!isNaN(limit) && limit > 0 && amount <= limit) {
      status = "autoapproved";
      processedAt = new Date();
    }

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
      status: status === "approved" ? "success" : "pending",
      date: new Date(),
    });

    user.withdrawals.push({
      orderId,
      amount,
      purse,
      network,
      paymentMethod,
      status,
      createdAt: new Date(),
      processedAt,
    });

    user.assets -= amount;
    user.notifications.push({
      type: "Withdraw",
      read: false,
      message: `You have made a Withdrawal of $${amount}.`,
      date: new Date(),
    });
    await user.save();

    res.status(201).json({
      message:
        status === "approved"
          ? "Withdrawal auto-approved"
          : "Withdrawal submitted",
    });
  } catch (err) {
    console.error("Error processing withdrawal:", err);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
};

// Get user transactions
export const getUserTransactions = async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, { transactions: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user.transactions || []);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const saveUserTrade = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }

  try {
    const { email, trade, openedByAdmin = false } = req.body;
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
      createdAt: new Date(),
      manualClose: false, // Initialize as false
      openedByAdmin: openedByAdmin, // Set based on request
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
};

export const updateTradeResult = async (req, res) => {
  try {
    const { email, startedAt, result, reward, exitPrice } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Debug: Print all startedAt values and types for this user
    console.log("[DEBUG] updateTradeResult: Incoming startedAt:", startedAt, typeof startedAt);
    user.trades.forEach((t, idx) => {
      console.log(
        `[DEBUG] Trade #${idx}: startedAt=`,
        t.startedAt,
        typeof t.startedAt,
        t.startedAt instanceof Date ? t.startedAt.getTime() : t.startedAt
      );
    });

    // Robust matching: handle both Date and number types
    const tradeIndex = user.trades.findIndex((t) => {
      if (!t.startedAt) return false;
      let tTime = t.startedAt instanceof Date ? t.startedAt.getTime() : Number(t.startedAt);
      let sTime = typeof startedAt === "string" || typeof startedAt === "number" ? Number(startedAt) : new Date(startedAt).getTime();
      return tTime === sTime;
    });

    if (tradeIndex === -1) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const trade = user.trades[tradeIndex];
    if (trade.result && trade.result !== "pending") {
      return res.status(400).json({ error: "Trade already closed" });
    }

    user.trades[tradeIndex].result = result;
    user.trades[tradeIndex].reward = reward;
    user.trades[tradeIndex].exitPrice = exitPrice;

    const today = new Date().toISOString().slice(0, 10);
    let profitChange = 0;
    
    // Handle manual close logic
    if (result === "win") {
      // For winning trades, set manualClose to true and don't add profit yet
      user.trades[tradeIndex].manualClose = true;
      profitChange = 0; // Don't add profit to daily profits until manually closed
      
      // Don't add to user assets yet - wait for manual close
    } else if (result === "loss") {
      // For losing trades, automatically close and update assets
      user.trades[tradeIndex].manualClose = false;
      profitChange = -user.trades[tradeIndex].investment;
      // Assets are already deducted when trade was created, no need to deduct again
    }

    let dailyEntry = user.dailyProfits.find((p) => p.date === today);
    if (dailyEntry) {
      dailyEntry.profit += profitChange;
    } else {
      user.dailyProfits.push({ date: today, profit: profitChange });
    }

    const coin = user.trades[tradeIndex].coin || "the asset";
    if (result === "win") {
      user.notifications.push({
        type: "Trade",
        read: false,
        message: `You won the trade on ${coin}. Click 'Close Trade' to collect your reward of $${reward}.`,
        date: new Date(),
      });
    } else if (result === "loss") {
      user.notifications.push({
        type: "Trade",
        read: false,
        message: `You lost the trade on ${coin} and lost $${user.trades[tradeIndex].investment}.`,
        date: new Date(),
      });
    }
    await user.save();

    res.status(200).json({ message: "Trade result updated", user });
  } catch (err) {
    console.error("Error updating trade result:", err);
    res.status(500).json({ error: "Failed to update trade result" });
  }
};

// Manual close trade (for winning trades only)
export const manualCloseTrade = async (req, res) => {
  try {
    const { email, startedAt } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the trade
    const tradeIndex = user.trades.findIndex((t) => {
      if (!t.startedAt) return false;
      let tTime = t.startedAt instanceof Date ? t.startedAt.getTime() : Number(t.startedAt);
      let sTime = typeof startedAt === "string" || typeof startedAt === "number" ? Number(startedAt) : new Date(startedAt).getTime();
      return tTime === sTime;
    });

    if (tradeIndex === -1) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const trade = user.trades[tradeIndex];

    // Validate trade can be manually closed
    if (trade.result !== "win") {
      return res.status(400).json({ error: "Only winning trades can be manually closed" });
    }

    if (!trade.manualClose) {
      return res.status(400).json({ error: "Trade is not pending manual close" });
    }

    // Additional safety check: ensure trade is not a loss
    if (trade.result === "loss") {
      return res.status(400).json({ error: "Cannot manually close a losing trade" });
    }

    // Add reward to user assets
    user.assets += trade.reward;

    // Add profit to daily profits
    const today = new Date().toISOString().slice(0, 10);
    let dailyEntry = user.dailyProfits.find((p) => p.date === today);
    if (dailyEntry) {
      dailyEntry.profit += trade.reward;
    } else {
      user.dailyProfits.push({ date: today, profit: trade.reward });
    }

    // Mark trade as manually closed
    user.trades[tradeIndex].manualClose = false; // Trade is now fully closed

    // Add notification
    const coin = trade.coin || "the asset";
    user.notifications.push({
      type: "Trade",
      read: false,
      message: `You successfully closed your winning trade on ${coin} and earned $${trade.reward}.`,
      date: new Date(),
    });

    await user.save();

    res.status(200).json({ 
      message: "Trade manually closed successfully", 
      reward: trade.reward,
      newBalance: user.assets + user.totalBonus 
    });
  } catch (err) {
    console.error("Error manually closing trade:", err);
    res.status(500).json({ error: "Failed to manually close trade" });
  }
};

export const getUserTrades = async (req, res) => {
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
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      dateOfBirth,
      cnicNumber,
      passportNumber,
      cnicBackPicture: cnicBackPictureBody,
      // ...other fields...
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Fetch the user first to get current values
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Build the update object
    const update = {
      firstName,
      lastName,
      dateOfBirth,
      cnicNumber,
      passportNumber,
    };

    // Add this block to handle CNIC back image update
    if (req.files?.cnicBackPicture) {
      update.cnicBackPicture = `uploads/cnic/${req.files.cnicBackPicture[0].filename}`;
    }

    if (req.files?.profilePicture) {
      update.profilePicture = `uploads/profile/${req.files.profilePicture[0].filename}`;
    } else if (
      typeof req.body.profilePicture === "string" &&
      req.body.profilePicture === ""
    ) {
      update.profilePicture = "";
    } else {
      update.profilePicture = user.profilePicture;
    }

    if (req.files?.cnicPicture) {
      const cnicImagePath = path.resolve(
        "uploads/cnic",
        req.files.cnicPicture[0].filename
      );
      update.cnicPicture = `uploads/cnic/${req.files.cnicPicture[0].filename}`;

      try {
        const {
          data: { text },
        } = await Tesseract.recognize(cnicImagePath, "eng");
        const match = text.match(/(\d{5}-\d{7}-\d{1})|(\d{13})/);
        update.imgCNIC = match ? match[0] : "";
      } catch (ocrErr) {
        console.error("OCR error:", ocrErr);
        update.imgCNIC = "";
      }

      if (
        update.imgCNIC &&
        req.body.cnicNumber &&
        update.imgCNIC !== req.body.cnicNumber
      ) {
        return res.status(400).json({ error: "CNIC image does not match" });
      }
    } else if (
      typeof req.body.cnicPicture === "string" &&
      req.body.cnicPicture === ""
    ) {
      update.cnicPicture = "";
      update.imgCNIC = "";
    } else {
      update.cnicPicture = user.cnicPicture;
      update.imgCNIC = user.imgCNIC;
    }

    // --- FIX: Preserve CNIC Back Picture ---
    if (req.files?.cnicBackPicture) {
      update.cnicBackPicture = `uploads/cnic/${req.files.cnicBackPicture[0].filename}`;
      console.log("Saving CNIC BACK:", update.cnicBackPicture); // <--- ADD THIS
    } else if (
      typeof cnicBackPictureBody === "string" &&
      cnicBackPictureBody === ""
    ) {
      update.cnicBackPicture = "";
    } else {
      update.cnicBackPicture = user.cnicBackPicture;
    }
    // --- END FIX ---

    if (req.files?.passportImage) {
      update.passportImage = `uploads/others/${req.files.passportImage[0].filename}`;
    } else if (
      typeof req.body.passportImage === "string" &&
      req.body.passportImage === ""
    ) {
      update.passportImage = "";
    } else {
      update.passportImage = user.passportImage;
    }

    const updatedUser = await User.findOneAndUpdate({ email }, update, {
      new: true,
    });
    user.notifications.push({
      type: "Profile",
      read: false,
      message: "You have updated your profile.",
      date: new Date(),
    });
    await user.save();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Error in update-profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Verify user
export const verifyUser = async (req, res) => {
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
};

// Unverify user
export const unverifyUser = async (req, res) => {
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
};

// Check verification status
export const checkVerificationStatus = async (req, res) => {
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
};

// Validate CNIC
export const validateCNIC = async (req, res) => {
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
    console.error("Error validating CNIC:", err);
    res.status(500).json({ error: "Failed to validate CNIC" });
  }
};

// Block user
export const blockUser = async (req, res) => {
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
        rejectUnauthorized: false,
      },
    });
    user.notifications.push({
      type: "Account",
      read: false,
      message: `Your Account was blocked beacuse of : ${reason}`,
      date: new Date(),
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
      if (user) {
        user.emailError = error.message;
        await user.save();
      }
    }
  }
  res.json({ success: true });
};

// Unblock user
export const unblockUser = async (req, res) => {
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
      user.notifications.push({
        type: "Account",
        read: false,
        message: "Your Account has been unblocked.",
        date: new Date(),
      });
      await user.save();
    } catch (error) {
      console.error("Error sending unblock email:", error);
    }
  }
  res.json({ success: true });
};

// Test email
export const testEmail = async (req, res) => {
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
      to: process.env.EMAIL_USER,
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
};

export const getUserWithdrawals = async (req, res) => {
  const { email } = req.params;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json([]);
  res.json(user.withdrawals || []);
};

// Approve withdrawal
export const approveWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;
  try {
    // Find the user who has this withdrawal
    const user = await User.findOne({ "withdrawals._id": withdrawalId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Find the withdrawal and update status
    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal)
      return res.status(404).json({ error: "Withdrawal not found" });

    withdrawal.status = "approved";
    withdrawal.processedAt = new Date();

    // Optionally, update the corresponding transaction status
    const transaction = user.transactions.find(
      (t) => t.orderId === withdrawal.orderId && t.type === "withdrawal"
    );
    if (transaction) {
      transaction.status = "success";
    }

    await user.save();
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
};

// Reject withdrawal
export const rejectWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;
  try {
    const user = await User.findOne({ "withdrawals._id": withdrawalId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal)
      return res.status(404).json({ error: "Withdrawal not found" });

    withdrawal.status = "rejected";
    withdrawal.processedAt = new Date();

    // Optionally, update the corresponding transaction status
    const transaction = user.transactions.find(
      (t) => t.orderId === withdrawal.orderId && t.type === "withdrawal"
    );
    if (transaction) {
      transaction.status = "failed";
    }

    // Optionally, refund the amount to the user's assets
    user.assets += withdrawal.amount;

    await user.save();
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
};

export const updateTipStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tipName } = req.body;

    if (!tipName) {
      return res.status(400).json({ message: "tipName is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const tip = user.tips.find((t) => t.text === tipName);
    if (!tip)
      return res.status(404).json({ message: `Tip '${tipName}' not found` });

    tip.status = false;
    await user.save();

    res.json({ message: `Tip '${tipName}' updated to true`, tips: user.tips });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }, { notifications: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });
    const notifications = user.notifications || [];
    // Sort: unread first, then by date desc
    notifications.sort((a, b) => {
      if (a.read === b.read) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.read ? 1 : -1;
    });
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    let updated = false;
    user.notifications = (user.notifications || []).map((n) => {
      if (!n.read) {
        updated = true;
        return { ...n, read: true };
      }
      return n;
    });
    if (updated) await user.save();
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};

export const createNotification = async (req, res) => {
  const { email, notification } = req.body;
  console.log(req.body);

  if (!email || !notification) {
    return res
      .status(400)
      .json({ error: "Email and notification are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.notifications = user.notifications || [];
    user.notifications.push({
      ...notification,
      createdAt: new Date(),
      read: false,
    });
    await user.save();

    res.status(201).json({
      message: "Notification created",
      notifications: user.notifications,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
};

export const submitSupportRequest = async (req, res) => {
  try {
    const { email, subject, issue } = req.body;
    if (!email || !subject || !issue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const screenshots = (req.files || []).map(
      (file) => `uploads/support/${file.filename}`
    );

    user.complaints = user.complaints || [];
    user.complaints.push({
      subject,
      issue,
      screenshots,
      status: "pending",
      createdAt: new Date(),
    });

    await user.save();

    // --- Send confirmation email to user ---
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
        to: email,
        subject: "Support Request Received",
        text: `Dear ${
          user.firstName || "User"
        },\n\nWe have received your support request regarding "${subject}". Our team will review it and resolve your query as soon as possible.\n\nThank you for contacting support!\n\nBest regards,\nSupport Team`,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Failed to send support confirmation email:", emailErr);
      // Don't fail the request if email fails
    }
    // --- End email ---

    res.status(201).json({ message: "Support request submitted successfully" });
  } catch (err) {
    console.error("Error submitting support request:", err);
    res.status(500).json({ error: "Failed to submit support request" });
  }
};

export const getSupportRequests = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json([]);
    res.json(user.complaints || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support requests" });
  }
};

export const getTotalTradeCount = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { trades: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });
    const totalTrades = Array.isArray(user.trades) ? user.trades.length : 0;
    res.json({ totalTrades });
  } catch (err) {
    res.status(500).json({ error: "Failed to get total trade count" });
  }
};

export const getRunningTradePercentage = async (req, res) => {
  console.log("=== TRADE PERCENTAGE ENDPOINT HIT ===");
  try {
    console.log("getRunningTradePercentage called");
    const users = await User.find(
      { "trades.result": "pending" },
      { trades: 1 }
    );
    console.log("Users found:", users.length);
    if (users.length > 0) {
      console.log("Sample user:", JSON.stringify(users[0], null, 2));
    }
    if (!users || users.length === 0) {
      return res.status(200).json({ buyPercentage: 0, sellPercentage: 0 });
    }

    let buyCount = 0;
    let sellCount = 0;
    let resultValues = [];

    users.forEach((user) => {
      if (!Array.isArray(user.trades)) {
        console.warn(
          "User with malformed trades array:",
          user._id,
          user.trades
        );
        return;
      }
      user.trades.forEach((trade) => {
        resultValues.push(trade.result);
        if (trade.result === "pending") {
          if (trade.type === "Buy") buyCount++;
          else if (trade.type === "Sell") sellCount++;
        }
      });
    });

    console.log("Trade result values:", resultValues);

    const totalRunningTrades = buyCount + sellCount;
    const buyPercentage =
      totalRunningTrades > 0
        ? ((buyCount / totalRunningTrades) * 100).toFixed(2)
        : 0;
    const sellPercentage =
      totalRunningTrades > 0
        ? ((sellCount / totalRunningTrades) * 100).toFixed(2)
        : 0;

    console.log({
      buyCount,
      sellCount,
      totalRunningTrades,
      buyPercentage,
      sellPercentage,
    });
    res.json({ buyPercentage, sellPercentage });
  } catch (err) {
    console.error("Error getting running trade percentage:", err);
    res.status(500).json({
      error: "Failed to get running trade percentage",
      details: err.message,
    });
  }
};

// Get pending deposits for a user
export const getPendingDeposits = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First get the user to find their email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Find ALL pending deposits for the user using their email
    const pendingDeposits = await Deposit.find({
      userEmail: user.email,
      status: "pending"
    }).sort({ createdAt: -1 });
    
    if (pendingDeposits && pendingDeposits.length > 0) {
      // Calculate total pending amount
      const totalPendingAmount = pendingDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
      
      res.json({
        hasPending: true,
        deposits: pendingDeposits.map(deposit => ({
          _id: deposit._id,
          amount: deposit.amount,
          status: deposit.status,
          createdAt: deposit.createdAt,
          userEmail: deposit.userEmail
        })),
        totalPendingAmount,
        pendingCount: pendingDeposits.length,
        // Keep the single deposit for backward compatibility
        deposit: {
          _id: pendingDeposits[0]._id,
          amount: pendingDeposits[0].amount,
          status: pendingDeposits[0].status,
          createdAt: pendingDeposits[0].createdAt,
          userEmail: pendingDeposits[0].userEmail
        }
      });
    } else {
      res.json({
        hasPending: false,
        deposits: [],
        totalPendingAmount: 0,
        pendingCount: 0,
        deposit: null
      });
    }
  } catch (err) {
    console.error("Error getting pending deposits:", err);
    res.status(500).json({
      error: "Failed to get pending deposits",
      details: err.message
    });
  }
};
