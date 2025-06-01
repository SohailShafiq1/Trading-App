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
    } else {
      cb(null, "uploads/others/");
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
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
      status: "verified", // <-- Now deposits are auto-approved
    });

    await deposit.save();

    // CREDIT USER IMMEDIATELY IF VERIFIED
    if (deposit.status === "verified") {
      // Only credit if not already credited for this deposit
      const existingTransaction = user.transactions.find(
        (t) => t.orderId === deposit._id.toString() && t.type === "deposit"
      );
      if (!existingTransaction) {
        user.assets += Number(deposit.amount);
        user.depositCount = (user.depositCount || 0) + 1;

        user.transactions.push({
          orderId: deposit._id.toString(),
          type: "deposit",
          amount: deposit.amount,
          paymentMethod: deposit.network || "USDT (TRC-20)",
          status: "success",
          date: new Date(),
        });

        // Apply bonus if exists
        if (deposit.bonusAmount && deposit.bonusAmount > 0) {
          user.totalBonus = (user.totalBonus || 0) + deposit.bonusAmount;
          user.assets += deposit.bonusAmount; // Add bonus to assets

          // Track bonus percent if not already tracked
          if (
            deposit.bonusPercent &&
            !user.usedBonuses.includes(deposit.bonusId)
          ) {
            user.usedBonuses.push(deposit.bonusId);
          }
        }

        await user.save();
      }
    }

    if (bonusId && bonusPercent > 0 && !user.usedBonuses.includes(bonusId)) {
      user.usedBonuses.push(bonusId);
      await user.save();
    }

    res.status(201).json({
      message: "Deposit submitted and approved.",
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
};

export const updateTradeResult = async (req, res) => {
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

    const today = new Date().toISOString().slice(0, 10);
    let profitChange = 0;
    if (result === "win") {
      profitChange = reward;
    } else if (result === "loss") {
      profitChange = -user.trades[tradeIndex].investment;
    }

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
