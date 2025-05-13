import express from "express";
import User from "../models/User.js";

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
  const { status } = req.query; // Allows filtering (e.g., ?status=pending)

  try {
    const users = await User.find(
      status ? { "withdrawals.status": status } : {}, // ✅ Fetch all if no filter
      { email: 1, withdrawals: 1 }
    );

    // Flatten all requests (or filter if `status` is provided)
    const allRequests = users.flatMap(user => 
      user.withdrawals
        .filter(w => !status || w.status === status) // ✅ Apply filter if provided
        .map(w => ({
          email: user.email,
          withdrawalId: w._id.toString(),
          amount: w.amount,
          purse: w.purse,
          network: w.network,
          paymentMethod: w.paymentMethod,
          status: w.status, // ✅ Include status in response
          createdAt: w.createdAt,
          processedAt: w.processedAt
        }))
    );

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
    // Find the user with this withdrawal request
    const user = await User.findOne({ "withdrawals._id": withdrawalId });
    if (!user) return res.status(404).json({ error: "Request not found" });

    // Find the specific withdrawal
    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Mark as approved
    withdrawal.status = "approved";
    withdrawal.processedAt = new Date();

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

    // Return the money to the user
    user.assets += withdrawal.amount;

    // Mark as rejected
    withdrawal.status = "rejected";
    withdrawal.processedAt = new Date();

    await user.save();
    res.status(200).json({ message: "Request rejected & funds returned" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});
export default router;
