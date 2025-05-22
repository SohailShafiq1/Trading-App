// controllers/affiliate.controller.js
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
