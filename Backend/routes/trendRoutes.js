import express from "express";
import {
  getCurrentTrend,
  updateTrend,
} from "../controllers/trendController.js";

const router = express.Router();

// Admin trend endpoints
router.get("/", getCurrentTrend);
router.post("/", updateTrend);

export default router;
