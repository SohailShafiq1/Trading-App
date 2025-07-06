import axios from "axios";
import Deposit from "../models/Deposit.js";
import User from "../models/User.js";

const ADMIN_WALLET = process.env.ADMIN_TRON_WALLET;

export const handleTRC20Deposit = async (req, res) => {
  const { email, amount, txId, fromAddress, bonusPercent } = req.body;

  if (!email || !amount || !fromAddress || !txId) {
    return res
      .status(400)
      .json({ error: "Email, amount, fromAddress, and txId are required." });
  }

  try {
    let bonusAmount = 0;
    if (bonusPercent) {
      // Give bonus on the deposited amount, even if it's more than the bonus min
      bonusAmount = Math.floor((Number(amount) * Number(bonusPercent)) / 100);
    }

    // Step 1: Save deposit as pending first
    const deposit = new Deposit({
      userEmail: email,
      amount,
      txId, // Always save txId
      fromAddress,
      wallet: ADMIN_WALLET,
      status: "pending",
      bonusPercent: bonusPercent || 0,
      bonusAmount,
    });
    await deposit.save();

    // Step 2: Verify on-chain using TronGrid
    const response = await axios.get(
      `https://api.trongrid.io/v1/accounts/${fromAddress}/transactions/trc20?limit=50`
    );

    const txList = response.data.data;
    const matched = txList.find(
      (tx) =>
        tx.to.toLowerCase() === ADMIN_WALLET.toLowerCase() &&
        tx.value / 1e6 === Number(amount) &&
        (!txId || tx.transaction_id === txId)
    );

    if (matched) {
      deposit.status = "verified";
      deposit.txId = matched.transaction_id;
      deposit.notified = false;
      await deposit.save();

      const user = await User.findOne({ email });
      if (user) {
        user.assets += Number(amount);
        user.depositCount = (user.depositCount || 0) + 1;
        user.transactions.push({
          orderId: Math.floor(100000 + Math.random() * 900000).toString(),
          type: "deposit",
          amount,
          paymentMethod: "TRC20 Wallet",
          status: "success",
          date: new Date(),
        });

        if (deposit.bonusAmount && deposit.bonusAmount > 0) {
          user.totalBonus = (user.totalBonus || 0) + deposit.bonusAmount;
        }

        await user.save();
      }

      return res
        .status(200)
        .json({ message: "Deposit verified and credited." });
    } else {
      return res.status(202).json({
        message:
          "Deposit recorded but not verified yet. Will recheck manually.",
      });
    }
  } catch (err) {
    console.error("Deposit verification error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong while checking blockchain." });
  }
};
