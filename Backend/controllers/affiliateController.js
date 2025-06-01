
import Affiliate from "../models/Affiliate.js";
import User from "../models/User.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const createToken = (affiliate) => {
  return jwt.sign(
    { id: affiliate._id, email: affiliate.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const PrizeArray = [
  {
    id: 1,
    prize: "100$",
    timeLimit: 5,
    conditions: { deposit: "$2500", profit: "$2000" },
  },
  {
    id: 2,
    prize: "300$",
    timeLimit: 5,
    conditions: { deposit: "$3000", profit: "$2500" },
  },
  {
    id: 3,
    prize: "500$",
    timeLimit: 5,
    conditions: { deposit: "$4000", profit: "$3000" },
  },
  {
    id: 4,
    prize: "1000$",
    timeLimit: 5,
    conditions: { deposit: "$5000", profit: "$4000" },
  },
  {
    id: 5,
    prize: "5000$",
    timeLimit: 5,
    conditions: { deposit: "$7000", profit: "$6000" },
  },
  {
    id: 6,
    prize: "15,000$",
    timeLimit: 3,
    conditions: { deposit: "$10000", profit: "$9000" },
  },
  {
    id: 7,
    prize: "30,000$",
    timeLimit: 3,
    conditions: { deposit: "$15000", profit: "$14000" },
  },
];

export const registerAffiliate = async (req, res) => {
  try {
    const { email, password, country, currency = "USD" } = req.body;

    if (!email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and country are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const existingAffiliate = await Affiliate.findOne({ email });
    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: "Already registered as affiliate",
      });
    }

    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    const referralLink = `${process.env.BASE_URL}/signup?ref=${code}`;

    const affiliate = new Affiliate({
      email,
      password,
      country,
      currency: currency.toUpperCase(),
      user: user._id,
      affiliateCode: code,
      referralLink,
    });

    await affiliate.save();

    return res.status(201).json({
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

    const affiliate = await Affiliate.findOne({ email }).select("+password");
    if (!affiliate)
      return res
        .status(404)
        .json({ success: false, message: "Affiliate not found" });

    const isMatch = await affiliate.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = createToken(affiliate);

    return res.status(200).json({
      success: true,
      token,
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        referralLink: affiliate.referralLink,
        level: affiliate.level,
        team: affiliate.team,
        code: affiliate.affiliateCode,
      },
      message: "Affiliate login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getAffiliateDetails = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const affiliate = await Affiliate.findById(decoded.id).select("-password");

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found",
      });
    }

    return res.status(200).json({
      success: true,
      affiliate,
    });
  } catch (error) {
    console.error("Server error while fetching affiliate details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching affiliate details",
    });
  }
};

export const getTeamUsersByAffiliateEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const affiliate = await Affiliate.findOne({ email: email.toLowerCase() });
    if (!affiliate) {
      return res
        .status(404)
        .json({ success: false, message: "Affiliate not found" });
    }

    const teamUsers = await User.find({
      email: { $in: affiliate.team },
    }).select("-password");

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
    if (!affiliate)
      return res.status(404).json({ error: "Affiliate not found" });

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
    if (!affiliate)
      return res.status(404).json({ error: "Affiliate not found" });

    const currentLevel = affiliate.level || 1;
    const prize = PrizeArray.find((l) => l.id === currentLevel);
    if (!prize) return res.status(400).json({ error: "Invalid level" });

    // Check if time has expired
    const timeElapsed =
      Date.now() - new Date(affiliate.levelStartTime).getTime();
    const timeLimitMs = prize.timeLimit * 24 * 60 * 60 * 1000;

    if (timeElapsed > timeLimitMs) {
      // Time expired - reset to level 1
      affiliate.level = 1;
      affiliate.levelStartTime = Date.now();
      await affiliate.save();

      return res.status(400).json({
        success: false,
        message: "Time expired! You've been reset to Level 1",
        timeExpired: true,
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
        timeLeft: timeLimitMs - timeElapsed,
      });
    }

    // Update level logic
    if (currentLevel === PrizeArray.length) {
      // User completed the last level, reset to level 1
      affiliate.level = 1;
      affiliate.levelStartTime = Date.now();
    } else {
      // Move to next level
      affiliate.level = currentLevel + 1;
      affiliate.levelStartTime = Date.now();
    }
    if (!affiliate.prize) affiliate.prize = [];
    affiliate.prize.push(prize.prize);

    // Calculate the sum of all prizes
    affiliate.totalPrize = affiliate.prize
      .map((p) => Number(String(p).replace(/[^0-9.]/g, "")))
      .reduce((a, b) => a + b, 0);

    await affiliate.save();

    res.json({
      success: true,
      newLevel: affiliate.level,
      reset: currentLevel === PrizeArray.length, // Optionally tell frontend if reset happened
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Add this new function to check level status
export const checkLevelStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate)
      return res.status(404).json({ error: "Affiliate not found" });

    const currentLevel = affiliate.level || 1;
    const prize = PrizeArray.find((l) => l.id === currentLevel);
    if (!prize) return res.status(400).json({ error: "Invalid level" });

    const timeElapsed =
      Date.now() - new Date(affiliate.levelStartTime).getTime();
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
        timeLeft: PrizeArray[0].timeLimit * 24 * 60 * 60 * 1000,
      });
    }

    res.json({
      level: affiliate.level,
      timeLeft,
      conditions: prize.conditions,
      currentDeposit: affiliate.totalDeposit,
      currentProfit: affiliate.totalProfit,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
// controllers/affiliate.controller.js

export const updateTrafficQuestions = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      console.log("No token found in header.");
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const affiliate = await Affiliate.findById(decoded.id);
    if (!affiliate) {
      console.log("Affiliate not found for ID:", decoded.id);
      return res.status(404).json({
        success: false,
        message: "Affiliate not found",
      });
    }

    console.log("Affiliate found:", affiliate.email);
    console.log("Request body:", req.body);

    const {
      primarySources,
      tiktokProfile,
      mainIncomeSource,
      monthlyEarningGoal,
    } = req.body;

    affiliate.trafficQuestions = {
      primarySources: primarySources || "",
      tiktokProfile: tiktokProfile || "",
      mainIncomeSource: mainIncomeSource || "",
      monthlyEarningGoal: monthlyEarningGoal || "",
    };

    affiliate.trafficQuestionsAnswered = true;
    await affiliate.save();

    return res.status(200).json({
      success: true,
      message: "Traffic questions submitted successfully",
    });
  } catch (err) {
    console.error("🔥 Error in updateTrafficQuestions:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update traffic questions",
      error: err.message,
    });
  }
};

export const getTrafficQuestionsList = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      questions: Affiliate.trafficQuestionsList,
    });
  } catch (err) {
    console.error("Error fetching traffic questions list:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch traffic questions list",
    });
  }
};

export const getAllAffiliates = async (req, res) => {
  try {
    const affiliates = await Affiliate.find().select("-password");
    res.json({ affiliates });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getTeamTotalDeposits = async (req, res) => {
  try {
    const { email } = req.params;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) {
      return res
        .status(404)
        .json({ success: false, message: "Affiliate not found" });
    }

    // Find all users in the affiliate's team
    const teamUsers = await User.find({ email: { $in: affiliate.team } });

    // Count all successful deposit transactions for all team users
    let totalDeposits = 0;
    teamUsers.forEach((user) => {
      if (Array.isArray(user.transactions)) {
        totalDeposits += user.transactions.filter(
          (t) => t.type === "deposit" && t.status === "success"
        ).length;
      }
    });

    return res.status(200).json({
      success: true,
      totalDeposits,
    });
  } catch (err) {
    console.error("Error calculating team total deposits:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getTeamTotalDeposits = async (req, res) => {
  try {
    const { email } = req.params;
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) {
      return res
        .status(404)
        .json({ success: false, message: "Affiliate not found" });
    }

    const teamUsers = await User.find({ email: { $in: affiliate.team } });
    let totalDeposits = 0;
    teamUsers.forEach((user) => {
      if (Array.isArray(user.transactions)) {
        totalDeposits += user.transactions.filter(
          (t) => t.type === "deposit" && t.status === "success"
        ).length;
      }
    });

    return res.status(200).json({
      success: true,
      totalDeposits,
    });
  } catch (err) {
    console.error("Error calculating team total deposits:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};