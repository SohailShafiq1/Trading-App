// routes/adminRoutes.js
import express from "express";
import {
  updateTrend,
  getCurrentTrend,
  getAllWithdrawalRequests,
  acceptWithdrawalRequest,
  declineWithdrawalRequest,
  getAllDeposits,
  updateDepositStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/trend", updateTrend);
router.get("/trend", getCurrentTrend);

router.get("/withdraw-requests", getAllWithdrawalRequests);
router.put("/withdraw-accept/:withdrawalId", acceptWithdrawalRequest);
router.put("/withdraw-decline/:withdrawalId", declineWithdrawalRequest);

router.get("/deposits", getAllDeposits);
router.put("/deposit-status/:id", updateDepositStatus);

// Get all trades from all users
router.get("/all-trades", async (req, res) => {
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
});

export default router;
