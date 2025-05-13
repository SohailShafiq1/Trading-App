import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get all registered users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude the password field
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get a user by email
router.get("/email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { password: 0 }); // Exclude the password field
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user by email:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/update-assets", async (req, res) => {
  const { email, assets } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { assets },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "Assets updated successfully", user });
  } catch (err) {
    console.error("Error updating assets:", err);
    res.status(500).json({ error: "Failed to update assets" });
  }
});

// Route to handle withdrawal requests
router.post("/withdraw", async (req, res) => {
  const { email, amount, purse, network, paymentMethod } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.assets < amount) return res.status(400).json({ error: "Insufficient balance" });
    if (!purse || !network || !paymentMethod) return res.status(400).json({ error: "All fields are required" });

    // Add new withdrawal to the array (instead of overwriting)
    user.withdrawals.push({
      amount,
      purse,
      network,
      paymentMethod,
      status: "pending",
      createdAt: new Date()
    });

    // Deduct the amount immediately
    user.assets -= amount;

    await user.save();
    res.status(201).json({ 
      message: "Withdrawal request submitted",
      withdrawal: user.withdrawals[user.withdrawals.length - 1] // Return the latest request
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});
export default router;
