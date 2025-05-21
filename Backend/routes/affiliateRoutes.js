import express from "express";
import {
  registerAffiliate,
  loginAffiliate,
  getAffiliateDetails,
  getTeamUsersByAffiliateEmail,
} from "../controllers/affiliateController.js";

const router = express.Router();

router.post("/register", registerAffiliate);
router.post("/login", loginAffiliate);
router.get("/me", getAffiliateDetails);
router.get("/team/:email", getTeamUsersByAffiliateEmail);
export default router;
