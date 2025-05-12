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

// Fetch all withdrawal requests
router.get("/withdraw-requests", async (req, res) => {
  try {
    const users = await User.find({ "withdraw.request": true }, "email withdraw");
    if (!users.length) {
      return res.status(404).json({ message: "No withdrawal requests found" });
    }
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching withdrawal requests:", err);
    res.status(500).json({ error: "Failed to fetch withdrawal requests" });
  }
});

// Accept a withdrawal request
router.put("/withdraw-accept/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.withdraw.request) {
      return res.status(400).json({ error: "No pending withdrawal request for this user" });
    }

    // Deduct the withdrawal amount from the user's assets
    if (user.assets < user.withdraw.amount) {
      return res.status(400).json({ error: "Insufficient balance to process withdrawal" });
    }

    user.assets -= user.withdraw.amount;
    user.withdraw.request = false;
    user.withdraw.approved = true;

    await user.save();

    res.status(200).json({ message: "Withdrawal request approved", user });
  } catch (err) {
    console.error("Error approving withdrawal request:", err);
    res.status(500).json({ error: "Failed to approve withdrawal request" });
  }
});

// Decline a withdrawal request
router.put("/withdraw-decline/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.withdraw.request) {
      return res.status(400).json({ error: "No pending withdrawal request for this user" });
    }

    // Return the withdrawal amount back to the user's assets
    user.assets += user.withdraw.amount;

    // Reset the withdrawal request fields
    user.withdraw.request = false;
    user.withdraw.approved = false;
    user.withdraw.amount = 0;
    user.withdraw.purse = "";
    user.withdraw.network = "";
    user.withdraw.paymentMethod = "";

    await user.save();

    res.status(200).json({ message: "Withdrawal request declined and assets returned", user });
  } catch (err) {
    console.error("Error declining withdrawal request:", err);
    res.status(500).json({ error: "Failed to decline withdrawal request" });
  }
});

export default router;
