// routes/bonusRoutes.js
import express from "express";
import {
  getAllBonuses,
  createBonus,
  deleteBonus,
  updateBonus,
} from "../controllers/bonusController.js";

const router = express.Router();

// Bonus routes
router.get("/", getAllBonuses);
router.post("/", createBonus);
router.delete("/:id", deleteBonus);
router.put("/:id", updateBonus);

export default router;