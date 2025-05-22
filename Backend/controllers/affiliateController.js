import { log } from "console";
import Affiliate from "../models/Affiliate.js";
import User from "../models/User.js";
import crypto from "crypto";

const PrizeArray = [
  { id: 1, prize: "100$", timeLimit: 5, conditions: { deposit: "$2500", profit: "$2000" } },
  { id: 2, prize: "300$", timeLimit: 5, conditions: { deposit: "$3000", profit: "$2500" } },
  { id: 3, prize: "500$", timeLimit: 5, conditions: { deposit: "$4000", profit: "$3000" } },
  { id: 4, prize: "1000$", timeLimit: 5, conditions: { deposit: "$5000", profit: "$4000" } },
  { id: 5, prize: "5000$", timeLimit: 5, conditions: { deposit: "$7000", profit: "$6000" } },
  { id: 6, prize: "15,000$", timeLimit: 3, conditions: { deposit: "$10000", profit: "$9000" } },
  { id: 7, prize: "30,000$", timeLimit: 3, conditions: { deposit: "$15000", profit: "$14000" } },
];

export const registerAffiliate = async (req, res) => {
  try {
    const { email, password, country, currency = "USD" } = req.body;

    // Basic validation
    if (!email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and country are required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check for existing affiliate
    const existingAffiliate = await Affiliate.findOne({ email });
    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: "Already registered as affiliate",
      });
    }

    // Generate affiliate code and link
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    const referralLink = `${process.env.BASE_URL}/signup?ref=${code}`;

    // Create new affiliate
    const affiliate = new Affiliate({
      email,
      password,
      country,
      currency: currency.toUpperCase(), // Normalize to uppercase
      user: user._id,
      affiliateCode: code,
      referralLink,
    });

    await affiliate.save();

    res.status(201).json({
      success: true,
      message: "Affiliate registration successful",
      data: {
        referralCode: code,
        referralLink,
        currency: affiliate.currency,
      },
    });
  } catch (error) {
    console.error("Affiliate registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const loginAffiliate = async (req, res) => {
  try {
    const { email, password } = req.body;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) return res.status(404).json({ msg: "Affiliate not found" });

    const isMatch = await affiliate.comparePassword(password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });
    console.log("Affiliate login successful", affiliate);
    res.status(200).json({
      email: affiliate.email,
      affiliateId: affiliate._id,
      referralLink: affiliate.referralLink,
      level: affiliate.level,
      team: affiliate.team,
      code: affiliate.affiliateCode,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
export const getAffiliateDetails = async (req, res) => {
  try {
    const user = await Affiliate.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTeamUsersByAffiliateEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // 1. Find affiliate by email
    const affiliate = await Affiliate.findOne({ email: email.toLowerCase() });
    if (!affiliate) {
      return res
        .status(404)
        .json({ success: false, message: "Affiliate not found" });
    }

    // 2. Get users whose emails match those in the affiliate's team
    const teamUsers = await User.find({
      email: { $in: affiliate.team },
    }).select("-password"); // exclude password field

    return res.status(200).json({
      success: true,
      teamUsers,
    });
  } catch (err) {
    console.error("Error fetching affiliate team users:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateTeamTotals = async (req, res) => {
  try {
    const { email } = req.params;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    // Find all team users by email
    const teamUsers = await User.find({ email: { $in: affiliate.team } });

    let totalDeposit = 0;
    let totalProfit = 0;

    teamUsers.forEach((user) => {
      if (Array.isArray(user.transactions)) {
        totalDeposit += user.transactions
          .filter((t) => t.type === "deposit" && t.status === "success")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
      }
      if (Array.isArray(user.dailyProfits)) {
        totalProfit += user.dailyProfits.reduce(
          (sum, d) => sum + (d.profit || 0),
          0
        );
      }
    });

    affiliate.totalDeposit = totalDeposit;
    affiliate.totalProfit = totalProfit;
    await affiliate.save();

    res.json({ success: true, totalDeposit, totalProfit });
  } catch (err) {
    res.status(500).json({ error: "Failed to update team totals" });
  }
};
// Update the completeLevel function
export const completeLevel = async (req, res) => {
  try {
    const { email } = req.params;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    const currentLevel = affiliate.level || 1;
    const prize = PrizeArray.find((l) => l.id === currentLevel);
    if (!prize) return res.status(400).json({ error: "Invalid level" });

    // Check if time has expired
    const timeElapsed = Date.now() - new Date(affiliate.levelStartTime).getTime();
    const timeLimitMs = prize.timeLimit * 24 * 60 * 60 * 1000;
    
    if (timeElapsed > timeLimitMs) {
      // Time expired - reset to level 1
      affiliate.level = 1;
      affiliate.levelStartTime = Date.now();
      await affiliate.save();
      
      return res.status(400).json({
        success: false,
        message: "Time expired! You've been reset to Level 1",
        timeExpired: true
      });
    }

    // Check conditions
    if (
      affiliate.totalDeposit < prize.conditions.deposit ||
      affiliate.totalProfit < prize.conditions.profit
    ) {
      return res.status(400).json({
        success: false,
        message: "Conditions not met",
        current: {
          deposit: affiliate.totalDeposit,
          profit: affiliate.totalProfit,
        },
        timeLeft: timeLimitMs - timeElapsed
      });
    }

    // Update level
    affiliate.level = currentLevel + 1;
    affiliate.levelStartTime = Date.now();
    await affiliate.save();

    res.json({ success: true, newLevel: affiliate.level });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Add this new function to check level status
export const checkLevelStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    const currentLevel = affiliate.level || 1;
    const prize = PrizeArray.find((l) => l.id === currentLevel);
    if (!prize) return res.status(400).json({ error: "Invalid level" });

    const timeElapsed = Date.now() - new Date(affiliate.levelStartTime).getTime();
    const timeLimitMs = prize.timeLimit * 24 * 60 * 60 * 1000;
    const timeLeft = Math.max(0, timeLimitMs - timeElapsed);

    // Check if time has expired
    if (timeElapsed > timeLimitMs) {
      // Time expired - reset to level 1
      affiliate.level = 1;
      affiliate.levelStartTime = Date.now();
      await affiliate.save();
      
      return res.json({
        level: 1,
        timeExpired: true,
        timeLeft: PrizeArray[0].timeLimit * 24 * 60 * 60 * 1000
      });
    }

    res.json({
      level: affiliate.level,
      timeLeft,
      conditions: prize.conditions,
      currentDeposit: affiliate.totalDeposit,
      currentProfit: affiliate.totalProfit
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};