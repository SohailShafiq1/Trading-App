import express from "express";
import {
  register,
  login,
  googleLogin,
  getMe,
  verifyToken,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/me", authMiddleware, getMe);
router.get("/verify", verifyToken);

export default router;
