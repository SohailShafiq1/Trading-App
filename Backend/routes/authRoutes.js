import express from "express";
import {
  register,
  login,
  googleLogin,
  getMe,
  verifyToken,
  deleteAccount,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/me", authMiddleware, getMe);
router.get("/verify", verifyToken);
router.delete("/delete-account", authMiddleware, deleteAccount);
export default router;
