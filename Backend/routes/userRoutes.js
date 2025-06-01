// routes/userRoutes.js
import express from "express";
import {
  healthCheck,
  createDeposit,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUserAssets,
  createWithdrawal,
  getUserTransactions,
  saveUserTrade,
  updateTradeResult,
  getUserTrades,
  updateUserProfile,
  verifyUser,
  unverifyUser,
  checkVerificationStatus,
  validateCNIC,
  upload,
  blockUser,
  unblockUser,
  testEmail,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/health", healthCheck);
router.post("/deposit", createDeposit);
router.get("/", getAllUsers);
router.get("/email/:email", getUserByEmail);
router.get("/:id", getUserById);
router.put("/update-assets", updateUserAssets);
router.post("/withdraw", createWithdrawal);
router.get("/transactions/:email", getUserTransactions);
router.post("/trade", saveUserTrade);
router.put("/trade/result", updateTradeResult);
router.get("/trades/:email", getUserTrades);
router.put(
  "/update-profile",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "cnicPicture", maxCount: 1 },
  ]),
  updateUserProfile
);
router.put("/verify/:id", verifyUser);
router.put("/unverify/:id", unverifyUser);
router.get("/is-verified/:id", checkVerificationStatus);
router.post("/validate-cnic", validateCNIC);
router.put("/block/:id", blockUser);
router.put("/unblock/:id", unblockUser);
router.post("/test-email", testEmail);
export default router;
