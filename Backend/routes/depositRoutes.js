// 🔐 Step 1: Backend route to validate TRC20 deposit using fromAddress + txId

import express from "express";
import axios from "axios";
import Deposit from "../models/Deposit.js";
import User from "../models/User.js";

const router = express.Router();
const ADMIN_WALLET = process.env.ADMIN_TRON_WALLET; // or hardcode if needed

// POST /api/users/deposit
router.post("/deposit", async (req, res) => {
  const { email, amount, txId, fromAddress } = req.body;

  if (!email || !amount || !fromAddress) {
    return res.status(400).json({ error: "Email, amount, and fromAddress are required." });
  }

  try {
    // Step 1: Save deposit as pending first
    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId,
      fromAddress,
      wallet: ADMIN_WALLET,
      status: "pending"
    });
    await deposit.save();

    // Step 2: Verify on-chain using TronGrid
    const response = await axios.get(
      `https://api.trongrid.io/v1/accounts/${fromAddress}/transactions/trc20?limit=50`
    );

    const txList = response.data.data;
    const matched = txList.find(tx =>
      tx.to.toLowerCase() === ADMIN_WALLET.toLowerCase() &&
      tx.value / 1e6 === Number(amount) &&
      (!txId || tx.transaction_id === txId)
    );

    if (matched) {
      // ✅ Match found - credit user
      deposit.status = "verified";
      deposit.txId = matched.transaction_id;
      deposit.notified = false;
      await deposit.save();

      const user = await User.findOne({ email });
      if (user) {
        user.assets += Number(amount);
        user.transactions.push({
          orderId: Math.floor(100000 + Math.random() * 900000).toString(),
          type: "deposit",
          amount,
          paymentMethod: "TRC20 Wallet",
          status: "success",
          date: new Date(),
        });
        await user.save();
      }

      return res.status(200).json({ message: "Deposit verified and credited." });
    } else {
      return res.status(202).json({ message: "Deposit recorded but not verified yet. Will recheck manually." });
    }
  } catch (err) {
    console.error("Deposit verification error:", err);
    return res.status(500).json({ error: "Something went wrong while checking blockchain." });
  }
});

export default router;
