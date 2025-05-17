import Affiliate from "../models/Affiliate.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        fullName: name,
        profilePicture: picture,
        authType: "google",
      });
    }

    const jwtToken = generateToken(user._id);
    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: "Google login failed" });
  }
};

const register = async (req, res) => {
  const { email, password, country, currency, referralCode } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    const newUser = new User({
      email,
      password,
      country,
      currency,
    });

    await newUser.save();

    // ✅ If referral code provided, find affiliate and update their team
    if (referralCode) {
      const affiliate = await Affiliate.findOne({
        affiliateCode: referralCode,
      });
      console.log("Affiliate found:", affiliate);
      if (affiliate) {
        affiliate.team.push(newUser._id);
        console.log("Updated affiliate team:", affiliate.team);

        await affiliate.save();
      }
    }

    const token = generateToken(newUser._id);
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Error Registering User" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = generateToken(user._id);
    if (!token) {
      return res.status(500).json({ message: "Error generating token" });
    }

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyToken = async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export { register, login, googleLogin, getMe, verifyToken };
