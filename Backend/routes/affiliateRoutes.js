import express from "express";
import {
  registerAffiliate,
  loginAffiliate,
  getAffiliateDetails,
  getTeamUsersByAffiliateEmail,
  updateTeamTotals,
  completeLevel,
  getTrafficQuestionsList,
  updateTrafficQuestions,
  getTeamTotalDeposits,
  getAllAffiliates,
} from "../controllers/affiliateController.js";

const router = express.Router();

router.post("/register", registerAffiliate);
router.post("/login", loginAffiliate);
router.get("/me", getAffiliateDetails);
router.get("/team/:email", getTeamUsersByAffiliateEmail);
router.get("/update-team-totals/:email", updateTeamTotals);
router.post("/complete-level/:email", completeLevel);
router.get("/traffic-questions-list", getTrafficQuestionsList);
router.put("/traffic-questions", updateTrafficQuestions);
router.get("/affiliates", getAllAffiliates);

export default router;
