import express from "express";
import { saveChartData, getCandles } from "../controllers/chartController.js";

const router = express.Router();

router.get("/:coinName", getCandles); // GET /api/chart/BTC
router.post("/save", saveChartData); // POST /api/chart/save

export default router;
