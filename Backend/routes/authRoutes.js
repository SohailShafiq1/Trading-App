import express from "express";
import {
  register,
  login,
  googleLogin,
  getMe,
  verifyToken,
  deleteAccount,
  checkAdmin,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/google-register", googleLogin); // Alias for clearer frontend usage
router.get("/me", authMiddleware, getMe);
router.get("/verify", verifyToken);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.post("/check-admin", checkAdmin);
export default router;
