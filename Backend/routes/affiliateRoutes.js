import express from "express";
import {
  registerAffiliate,
  loginAffiliate,
  getAffiliateDetails,
  getTeamUsersByAffiliateEmail,
  updateTeamTotals,
  completeLevel,
} from "../controllers/affiliateController.js";

const router = express.Router();

router.post("/register", registerAffiliate);
router.post("/login", loginAffiliate);
router.get("/me", getAffiliateDetails);
router.get("/team/:email", getTeamUsersByAffiliateEmail);
router.get("/update-team-totals/:email", updateTeamTotals);
router.post("/complete-level/:email", completeLevel);
export default router;
