import express from "express";
import { saveChartData, getCandles } from "../controllers/chartController.js";

const router = express.Router();

router.get("/:coinName", getCandles);
router.post("/save", saveChartData);

export default router;
