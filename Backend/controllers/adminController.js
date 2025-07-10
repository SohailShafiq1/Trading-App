// controllers/adminController.js
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import nodemailer from "nodemailer";
import AdminTrade from "../models/AdminTrade.js";
let currentTrend = "Normal"; // Default trend

// Trend Management
export const updateTrend = (req, res) => {
  const { mode } = req.body;
  if (!mode) {
    return res.status(400).json({ error: "Mode is required" });
  }
  currentTrend = mode;
  res
    .status(200)
    .json({ message: "Trend updated successfully", trend: currentTrend });
};

export const getCurrentTrend = (req, res) => {
  res.status(200).json({ trend: currentTrend });
};

// Withdrawal Management
export const getAllWithdrawalRequests = async (req, res) => {
  const { status } = req.query;

  try {
    const users = await User.find(
      status && status !== "all" ? { "withdrawals.status": status } : {},
      { email: 1, withdrawals: 1 }
    );

    const allRequests = users
      .flatMap((user) =>
        user.withdrawals
          .filter((w) => status === "all" || !status || w.status === status)
          .map((w) => ({
            email: user.email,
            withdrawalId: w._id.toString(),
            amount: w.amount,
            purse: w.purse,
            network: w.network,
            paymentMethod: w.paymentMethod,
            status: w.status,
            createdAt: w.createdAt,
            processedAt: w.processedAt,
          }))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

    res.status(200).json(allRequests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

export const acceptWithdrawalRequest = async (req, res) => {
  const { withdrawalId } = req.params;

  try {
    const user = await User.findOne({ "withdrawals._id": withdrawalId });
    if (!user) return res.status(404).json({ error: "Request not found" });

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") {
      return res.status(400).json({ error: "Invalid request" });
    }

    // 1. Update withdrawal status
    withdrawal.status = "approved";
    withdrawal.processedAt = new Date();

    // 2. Find and update corresponding transaction
    const transaction = user.transactions.find(
      (t) => t.orderId === withdrawal.orderId && t.type === "withdrawal"
    );

    if (transaction) {
      transaction.status = "success";
    }

    await user.save();
    res.status(200).json({ message: "Request approved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve request" });
  }
};

export const declineWithdrawalRequest = async (req, res) => {
  const { withdrawalId } = req.params;

  try {
    const user = await User.findOne({ "withdrawals._id": withdrawalId });
    if (!user) return res.status(404).json({ error: "Request not found" });

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") {
      return res.status(400).json({ error: "Invalid request" });
    }

    // 1. Return funds
    user.assets += withdrawal.amount;

    // 2. Update withdrawal status
    withdrawal.status = "rejected";
    withdrawal.processedAt = new Date();

    // 3. Find and update corresponding transaction
    const transaction = user.transactions.find(
      (t) => t.orderId === withdrawal.orderId && t.type === "withdrawal"
    );

    if (transaction) {
      transaction.status = "failed";
    }

    await user.save();
    res.status(200).json({ message: "Request rejected & funds returned" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject request" });
  }
};

// Deposit Management
export const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
};

export const updateDepositStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ error: "Deposit not found" });

    // Prevent duplicate processing
    if (deposit.status === status) {
      return res.status(400).json({ error: `Deposit is already ${status}` });
    }

    deposit.status = status;
    await deposit.save();

    // If admin verifies, credit user
    if (status === "verified") {
      const user = await User.findOne({ email: deposit.userEmail });
      if (user) {
        // Check if already credited
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
    }

    res.json({
      message: "Deposit status updated",
      deposit,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
// Get all trades from all users
export const getAllTrades = async (req, res) => {
  try {
    const users = await User.find(
      {},
      { email: 1, trades: 1, firstName: 1, lastName: 1 }
    );
    // Flatten all trades with user info
    const allTrades = users.flatMap((user) =>
      (user.trades || []).map((trade) => ({
        ...trade.toObject(),
        userEmail: user.email,
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }))
    );
    // Sort by createdAt descending
    allTrades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allTrades);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trades" });
  }
};

// Get all support requests from all users
export const getAllSupportRequests = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        firstName: 1,
        lastName: 1,
        email: 1,
        complaints: 1,
        userId: 1,
      }
    );

    const allRequests = users.flatMap((user) =>
      (user.complaints || []).map((complaint) => {
        const c = complaint.toObject ? complaint.toObject() : complaint;
        return {
          ...c,
          userName:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
          userId: user.userId,
          userEmail: user.email,
          _id: c._id,
          subject: c.subject,
          status: c.status,
          reviewed: c.reviewed || false,
          succeed: c.succeed || false,
          createdAt: c.createdAt,
          screenshots: (c.screenshots || []).map(
            (filename) =>
              `http://localhost:5000/${filename.replace(/\\/g, "/")}`
          ),
        };
      })
    );

    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allRequests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support requests" });
  }
};

export const markSupportReviewed = async (req, res) => {
  const { id } = req.params;
  try {
    // Find the user containing this complaint
    const user = await User.findOne({ "complaints._id": id });
    if (!user) return res.status(404).json({ error: "Complaint not found" });
    const complaint = user.complaints.id(id);
    if (!complaint)
      return res.status(404).json({ error: "Complaint not found" });
    complaint.reviewed = true;
    complaint.status = "reviewed";
    await user.save();

    // --- Send reviewed email ---
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
        to: user.email,
        subject: "Your Support Request Has Been Reviewed",
        text: `Dear ${
          user.firstName || "User"
        },\n\nOur team has reviewed your support request regarding "${
          complaint.subject
        }". We will resolve your query as soon as possible.\n\nThank you for your patience!\n\nBest regards,\nSupport Team`,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      // Don't fail the request if email fails
    }
    // --- End email ---

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update complaint" });
  }
};

export const markSupportCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ "complaints._id": id });
    if (!user) return res.status(404).json({ error: "Complaint not found" });
    const complaint = user.complaints.id(id);
    complaint.succeed = true;
    complaint.status = "succeed";
    await user.save();

    // --- Send completed email ---
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
        to: user.email,
        subject: "Your Support Request Has Been Completed",
        text: `Dear ${
          user.firstName || "User"
        },\n\nWe are pleased to inform you that your support request regarding "${
          complaint.subject
        }" has been resolved \n\nIf you have any further questions, feel free to contact us.\n\nBest regards,\nSupport Team`,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      // Don't fail the request if email fails
    }
    // --- End email ---

    res.json({ message: "Marked as completed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as completed" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      { email: { $exists: true, $ne: "" } },
      {
        _id: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        userId: 1,
        country: 1,
        createdAt: 1,
        isAdmin: 1, // Include isAdmin for frontend filtering
      }
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
// Get all admin trades
export const getAllAdminTrades = async (req, res) => {
  try {
    const trades = await AdminTrade.find()
      .populate("adminId", "email firstName lastName")
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin trades" });
  }
};
// Get all admins (not super admins)
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      isAdmin: true,
    })
      .select("email isAdmin createdAt access")
      .sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};
// Make user admin
export const makeUserAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Failed to make user admin" });
  }
};

// Remove admin access
export const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove admin access" });
  }
};
// Set admin access (super admin only)
export const setAdminAccess = async (req, res) => {
  try {
    const { userId, access } = req.body;
    if (!userId || !Array.isArray(access)) {
      return res
        .status(400)
        .json({ error: "userId and access array required" });
    }
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    user.access = access;
    await user.save();
    res.json({ success: true, access: user.access });
  } catch (err) {
    res.status(500).json({ error: "Failed to set admin access" });
  }
};
