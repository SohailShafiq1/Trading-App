import { log } from "console";
import Affiliate from "../models/Affiliate.js";
import User from "../models/User.js";
import crypto from "crypto";

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
