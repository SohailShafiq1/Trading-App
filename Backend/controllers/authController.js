import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Affiliate from "../models/Affiliate.js";
import { OAuth2Client } from "google-auth-library";
import { read } from "fs";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Register User
const register = async (req, res) => {
  const { email, password, country, currency, referralCode } = req.body;

  // Validate required fields
  if (!email || !password || !country) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and country are required",
    });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      country,
      currency: currency || "USD",
      notifications: [
        {
          type: "Registeration",
          message: "Welcome to the platform!",
          read: false,
          date: new Date(),
        },
      ], // Add initial notification
    });

    // Handle referral if provided
    if (referralCode) {
      try {
        const affiliate = await Affiliate.findOne({
          affiliateCode: referralCode,
        });
        if (affiliate) {
          affiliate.team.push(email); // Add user email instead of ID
          await affiliate.save();
        }
      } catch (affiliateError) {
        console.error("Referral processing error:", affiliateError);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    // Return response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Login User
const login = async (req, res) => {
  console.log("log in accessed");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is blocked
    if (user.blocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Reason: " + user.blockReason,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    // Add login notification
    user.notifications.push({
      type: "Login",
      read: false,
      message: "You have successfully logged in.",
      date: new Date(),
    });
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Google Login
const googleLogin = async (req, res) => {
  try {
    const { token, isRegistration, country, currency, referralCode } = req.body;
    
    console.log("🔍 Google Client ID from env:", process.env.GOOGLE_CLIENT_ID);
    console.log("🔍 Token received:", token ? "Token present" : "No token");
    console.log("🔍 Is registration:", isRegistration);
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist and this is not a registration attempt
      if (!isRegistration) {
        return res.status(404).json({
          success: false,
          message: "Account not found. Please register first.",
          needsRegistration: true,
        });
      }

      // Create new user during registration
      if (!country || !currency) {
        return res.status(400).json({
          success: false,
          message: "Country and currency are required for registration",
        });
      }

      user = await User.create({
        email,
        firstName: name?.split(" ")[0] || "",
        lastName: name?.split(" ")[1] || "",
        profilePicture: picture || "",
        authType: "google",
        country,
        currency,
        password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16),
        notifications: [
          {
            type: "Registration",
            message: "Welcome to the platform!",
            read: false,
            date: new Date(),
          },
        ],
      });

      // Handle referral if provided
      if (referralCode) {
        try {
          const affiliate = await Affiliate.findOne({
            affiliateCode: referralCode,
          });
          if (affiliate) {
            affiliate.team.push(email);
            await affiliate.save();
          }
        } catch (affiliateError) {
          console.error("Referral processing error:", affiliateError);
        }
      }
    } else {
      // User exists, check if this is a registration attempt
      if (isRegistration) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email. Please login instead.",
          userExists: true,
        });
      }

      // Add login notification for existing users
      user.notifications.push({
        type: "Login",
        read: false,
        message: "You have successfully logged in with Google.",
        date: new Date(),
      });
      await user.save();
    }

    const jwtToken = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: userResponse,
      message: isRegistration ? "Google registration successful" : "Google login successful",
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({
      success: false,
      message: "Google authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getMe = async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No authentication token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
// Verify Token
const verifyToken = async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No authentication token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
// Delete User Account and Affiliate
const deleteAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // For Google users, skip password verification
    if (user.authType === "google") {
      console.log("🔍 Google user deleting account, skipping password verification");
    } else {
      // For email users, verify password
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for email-authenticated users",
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid password",
        });
      }
    }

    // Delete user and affiliate in parallel
    await Promise.all([
      User.findOneAndDelete({ email }),
      Affiliate.deleteMany({ email }), // or affiliateEmail depending on your schema
    ]);

    res.status(200).json({
      success: true,
      message: "Account and associated affiliate data deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
const checkAdmin = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check admin status",
    });
  }
};

export {
  register,
  login,
  googleLogin,
  getMe,
  verifyToken,
  deleteAccount,
  checkAdmin,
};
