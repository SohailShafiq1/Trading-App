// routes/adminRoutes.js
import User from "../models/User.js";
import express from "express";
import {
  updateTrend,
  getCurrentTrend,
  getAllWithdrawalRequests,
  acceptWithdrawalRequest,
  declineWithdrawalRequest,
  getAllDeposits,
  updateDepositStatus,
  getAllTrades,
  getAllSupportRequests,
  markSupportReviewed,
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/trend", updateTrend);
router.get("/trend", getCurrentTrend);

router.get("/withdraw-requests", getAllWithdrawalRequests);
router.put("/withdraw-accept/:withdrawalId", acceptWithdrawalRequest);
router.put("/withdraw-decline/:withdrawalId", declineWithdrawalRequest);

router.get("/deposits", getAllDeposits);
router.put("/deposit-status/:id", updateDepositStatus);
router.get("/support-requests", getAllSupportRequests);
router.put("/support-reviewed/:id", markSupportReviewed);
// Get all trades from all users
router.get("/all-trades", getAllTrades);
export default router;
