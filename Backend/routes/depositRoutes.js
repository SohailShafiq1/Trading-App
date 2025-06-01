import express from "express";
import { handleTRC20Deposit } from "../controllers/depositController.js";

const router = express.Router();

router.post("/deposit", handleTRC20Deposit);

export default router;
