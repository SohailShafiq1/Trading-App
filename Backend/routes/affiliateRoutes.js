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
  getAllAffiliates,
  getTeamTotalDeposits,
  submitAffiliateWithdrawRequest,
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
router.get("/team-deposit-count/:email", getTeamTotalDeposits);
router.get("/affiliates", getAllAffiliates);
router.post("/withdraw", submitAffiliateWithdrawRequest);
export default router;
