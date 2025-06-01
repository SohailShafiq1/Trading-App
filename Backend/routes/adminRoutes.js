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

export default router;
