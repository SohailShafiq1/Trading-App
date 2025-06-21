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
  markSupportCompleted,
  getAllUsers,
  getAllAdminTrades,
  getAllAdmins,
  makeUserAdmin,
  removeAdmin,
  setAdminAccess,
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
router.put("/support-completed/:id", markSupportCompleted);
router.get("/all-trades", getAllTrades);
router.get("/all-users", getAllUsers);
router.get("/admin-trades", getAllAdminTrades);
router.get("/all-admins", getAllAdmins);
router.post("/make-admin", makeUserAdmin);
router.post("/remove-admin", removeAdmin);
router.post("/set-admin-access", setAdminAccess);

export default router;
