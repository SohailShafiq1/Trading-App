import Affiliate from "../models/Affiliate.js";
import User from "../models/User.js";
import crypto from "crypto";

export const registerAffiliate = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const existing = await Affiliate.findOne({ email });
    if (existing)
      return res.status(400).json({ msg: "Already registered as affiliate" });

    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // A1B2C3
    const referralLink = `https://yourapp.com/signup?ref=${code}`;

    const affiliate = new Affiliate({
      email,
      password,
      user: user._id,
      affiliateCode: code,
      referralLink,
    });

    await affiliate.save();
    res.status(201).json({
      msg: "Affiliate account created",
      referralCode: code,
      referralLink,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const loginAffiliate = async (req, res) => {
  try {
    const { email, password } = req.body;

    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) return res.status(404).json({ msg: "Affiliate not found" });

    const isMatch = await affiliate.comparePassword(password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    res.status(200).json({
      msg: "Login successful",
      affiliateId: affiliate._id,
      referralLink: affiliate.referralLink,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
