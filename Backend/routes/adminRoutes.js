import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
const router = express.Router();

let currentTrend = "Normal"; // Default trend

// Endpoint to update the trend
router.post("/trend", (req, res) => {
  const { mode } = req.body;
  if (!mode) {
    return res.status(400).json({ error: "Mode is required" });
  }
  currentTrend = mode;
  res
    .status(200)
    .json({ message: "Trend updated successfully", trend: currentTrend });
});

// Endpoint to fetch the current trend
router.get("/trend", (req, res) => {
  res.status(200).json({ trend: currentTrend });
});

// Fetch all withdrawal requests// Fetch ALL withdrawal requests (with optional status filter)
router.get("/withdraw-requests", async (req, res) => {
  const { status } = req.query;

  try {
    const users = await User.find(
      status ? { "withdrawals.status": status } : {},
      { email: 1, withdrawals: 1 }
    );

    const allRequests = users
      .flatMap((user) =>
        user.withdrawals
          .filter((w) => !status || w.status === status)
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
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});
// Accept a withdrawal request
router.put("/withdraw-accept/:withdrawalId", async (req, res) => {
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
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

// Decline a withdrawal request
router.put("/withdraw-decline/:withdrawalId", async (req, res) => {
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
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});
// Get all deposits
router.get("/deposits", async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
});

// Manually update deposit status
router.put("/deposit-status/:id", async (req, res) => {
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
    }

    res.json({
      message: "Deposit status updated",
      deposit,
    });
  } catch (err) {
    console.error("Error updating deposit status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
