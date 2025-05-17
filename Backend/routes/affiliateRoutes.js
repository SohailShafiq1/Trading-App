import express from "express";
import {
  registerAffiliate,
  loginAffiliate,
  getAffiliateDetails,
} from "../controllers/affiliateController.js";

const router = express.Router();

router.post("/register", registerAffiliate);
router.post("/login", loginAffiliate);
router.get("/me", getAffiliateDetails);

export default router;
