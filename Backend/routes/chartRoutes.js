import express from "express";
import { getCoinChart } from "../controllers/chartController.js";
import { updateDuration } from "../controllers/chartController.js";
import { addNewCoin } from "../controllers/chartController.js";

const router = express.Router();

router.get("/:coinName", getCoinChart);
router.post("/duration", updateDuration);
router.post("/add", addNewCoin);

export default router;
