import express from "express";
import {
  upsertLeaderboardEntry,
  getLeaderboardEntries,
  deleteLeaderboardEntry,
  updateLeaderboardEntry,
} from "../controllers/leaderboardController.js";

const router = express.Router();

router.post("/", upsertLeaderboardEntry); // POST /api/admin/leaderboard
router.get("/", getLeaderboardEntries); // GET  /api/admin/leaderboard
router.delete("/:id", deleteLeaderboardEntry); // DELETE /api/admin/leaderboard/:id
router.put("/:id", updateLeaderboardEntry); // PUT    /api/admin/leaderboard/:id

export default router;
