import express from "express";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";

const router = express.Router(); // ✅ Declare router at the top

// ✅ User Deposit Route
router.post("/deposit", async (req, res) => {
  const { email, amount, txId } = req.body;

  try {
    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId,
      wallet: process.env.ADMIN_TRON_WALLET // Set this in your .env file
    });

    await deposit.save();
    res.status(201).json({ message: "Deposit submitted, awaiting confirmation." });
  } catch (err) {
    console.error("Error creating deposit:", err);
    res.status(500).json({ error: "Failed to create deposit." });
  }
});

// ✅ Get all registered users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude the password field
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Get user by email
router.get("/email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { password: 0 });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user by email:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ✅ Update user assets
router.put("/update-assets", async (req, res) => {
  const { email, assets } = req.body;
  try {
    const user = await User.findOneAndUpdate({ email }, { assets }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "Assets updated successfully", user });
  } catch (err) {
    console.error("Error updating assets:", err);
    res.status(500).json({ error: "Failed to update assets" });
  }
});

// ✅ User Withdrawal Route
router.post("/withdraw", async (req, res) => {
  const { email, amount, purse, network, paymentMethod } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.assets < amount) return res.status(400).json({ error: "Insufficient balance" });

    const orderId = Math.floor(100000 + Math.random() * 900000).toString();

    // Add to transaction history
    user.transactions.push({
      orderId,
      type: "withdrawal",
      amount,
      paymentMethod: `${paymentMethod} (${network})`,
      status: "pending",
      date: new Date()
    });

    // Add to pending withdrawals
    user.withdrawals.push({
      orderId,
      amount,
      purse,
      network,
      paymentMethod,
      status: "pending",
      createdAt: new Date()
    });

    user.assets -= amount;
    await user.save();

    res.status(201).json({ message: "Withdrawal submitted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

// ✅ Get all user transactions
router.get("/transactions/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, { transactions: 1 });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user.transactions || []);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
