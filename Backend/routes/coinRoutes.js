import express from "express";
import * as coinController from "../controllers/coinController.js";

const router = express.Router();

router.get("/", coinController.getAllCoins);
router.get("/price/:name", coinController.getCoinPrice);
router.get("/name/:name", coinController.getCoinByName);
router.post("/", coinController.createCoin);
router.put("/:id", coinController.updateCoin);
router.delete("/:id", coinController.deleteCoin);
router.get("/candles/:name/:interval", coinController.getCoinCandles);
router.post("/trend", coinController.updateCoinTrend);
router.post("/trend/all", coinController.updateAllCoinTrends);
router.get("/type/:name", coinController.getCoinTypeByName);
export default router;
