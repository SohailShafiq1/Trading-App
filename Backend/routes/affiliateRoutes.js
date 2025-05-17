import express from "express";
import {
  registerAffiliate,
  loginAffiliate,
} from "../controllers/affiliateController.js";

const router = express.Router();

router.post("/register", registerAffiliate);
router.post("/login", loginAffiliate);

export default router;
