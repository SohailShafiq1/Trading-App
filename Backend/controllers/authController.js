import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
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
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Login User
const login = async (req, res) => {
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
        password:
          Math.random().toString(36).slice(-16) +
          Math.random().toString(36).slice(-16),
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
          // Silently handle affiliate processing errors
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
      message: isRegistration
        ? "Google registration successful"
        : "Google login successful",
      isAdmin: user.isAdmin,
    });
  } catch (error) {
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
      // Google user - no password verification needed
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
    res.status(500).json({
      success: false,
      message: "Failed to check admin status",
    });
  }
};

// Send Reset Password OTP
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email address",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiration (10 minutes from now)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP via email using existing nodemailer setup
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
      to: email,
      subject: "Password Reset OTP - WealthX Broker",
      text: `Dear ${
        user.firstName || "User"
      },\n\nYour password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nWealthX Broker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset OTP</h2>
          <p>Dear ${user.firstName || "User"},</p>
          <p>Your password reset OTP is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>WealthX Broker Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email address",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// Verify Reset Password OTP
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
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

    // Verify OTP again for security
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Update password (let the pre-save middleware handle hashing)
    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save();

    // Send confirmation email
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
      to: email,
      subject: "Password Reset Successful - WealthX Broker",
      text: `Dear ${
        user.firstName || "User"
      },\n\nYour password has been successfully reset.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nWealthX Broker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Password Reset Successful</h2>
          <p>Dear ${user.firstName || "User"},</p>
          <p>Your password has been successfully reset.</p>
          <p>You can now log in with your new password.</p>
          <p style="color: #f44336;"><strong>If you didn't make this change, please contact support immediately.</strong></p>
          <p>Best regards,<br>WealthX Broker Team</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
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
  sendResetOTP,
  verifyResetOTP,
  resetPassword,
};
