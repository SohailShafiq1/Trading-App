import express from "express";
import {
  upload,
  healthCheck,
  createDeposit,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUserAssets,
  withdraw,
  getUserTransactions,
  saveUserTrade,
  updateTradeResult,
  manualCloseTrade,
  getUserTrades,
  updateProfile,
  verifyUser,
  unverifyUser,
  checkVerificationStatus,
  validateCNIC,
  blockUser,
  unblockUser,
  testEmail,
  getUserWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  updateTipStatus,
  getNotifications,
  createNotification,
  submitSupportRequest,
  getSupportRequests,
  supportUpload,
  getTotalTradeCount,
  getRunningTradePercentage,
  markAllNotificationsRead,
  getPendingDeposits,
} from "../controllers/userController.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Middleware
router.use(express.json());

// Routes
router.get("/support", getSupportRequests);
router.get("/health", healthCheck);
router.post("/deposit", createDeposit);
router.get("/", getAllUsers);
router.get("/email/:email", getUserByEmail);
router.get("/:id", getUserById);
router.put("/update-assets", updateUserAssets);
router.post("/withdraw", withdraw);
router.get("/transactions/:email", getUserTransactions);
router.post("/trade", saveUserTrade);
router.put("/trade/result", updateTradeResult);
router.put("/trade/manual-close", manualCloseTrade);
router.get("/trades/:email", getUserTrades);
router.put(
  "/update-profile",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "cnicPicture", maxCount: 1 },
    { name: "cnicBackPicture", maxCount: 1 },
    { name: "passportImage", maxCount: 1 },
  ]),
  updateProfile
);
router.put("/verify/:id", verifyUser);
router.put("/unverify/:id", unverifyUser);
router.get("/is-verified/:id", checkVerificationStatus);
router.post("/validate-cnic", validateCNIC);
router.put("/block/:id", blockUser);
router.put("/unblock/:id", unblockUser);
router.post("/test-email", testEmail);
router.get("/withdrawals/:email", getUserWithdrawals);
router.put("/withdraw-accept/:withdrawalId", approveWithdrawal);
router.put("/withdraw-reject/:withdrawalId", rejectWithdrawal);
router.put("/update-tip/:userId", updateTipStatus);
router.get("/notifications/:email", getNotifications);
router.put("/notifications/mark-all-read/:email", markAllNotificationsRead);
router.post("/notifications/create", createNotification);
router.post(
  "/support",
  supportUpload.array("screenshots", 5),
  submitSupportRequest
);
router.get("/tradeCount/:email", getTotalTradeCount);
router.get("/trade-Percentage/trades", getRunningTradePercentage);
router.get("/pending-deposits/:userId", getPendingDeposits);

export default router;
