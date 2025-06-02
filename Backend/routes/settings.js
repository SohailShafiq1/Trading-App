import express from "express";
import {
  getWithdrawLimit,
  setWithdrawLimit,
} from "../controllers/settingsController.js";
const router = express.Router();

router.get("/withdraw-limit", getWithdrawLimit);
router.post("/withdraw-limit", setWithdrawLimit);

export default router;
