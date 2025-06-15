import cron from "node-cron";
import Affiliate from "../models/Affiliate.js";

// Backend LEVELS array matching frontend
const AFFILIATE_LEVELS = [
  { name: "Level 1", depositMin: 0, depositMax: 14 },
  { name: "Level 2", depositMin: 15, depositMax: 60 },
  { name: "Level 3", depositMin: 61, depositMax: 120 },
  { name: "Level 4", depositMin: 121, depositMax: 210 },
  { name: "Level 5", depositMin: 211, depositMax: 420 },
  { name: "Level 6", depositMin: 421, depositMax: 720 },
  { name: "Level 7", depositMin: 721, depositMax: Infinity },
];

// Runs every minute
cron.schedule("* * * * *", async () => {
  const now = Date.now();
  try {
    const affiliates = await Affiliate.find({});
    for (const affiliate of affiliates) {
      const timeElapsed = now - new Date(affiliate.levelStartTime).getTime();
      if (timeElapsed > 1 * 60 * 1000) {
        // 1 minute
        // Get the current level and its depositMin
        const currentLevel = affiliate.affiliateLevel || 1;
        const levelConfig = AFFILIATE_LEVELS[currentLevel - 1];
        affiliate.levelStartTime = now;
        affiliate.totalTeamDeposit = levelConfig.depositMin;
        await affiliate.save();
        console.log(
          `Affiliate ${
            affiliate.email
          } reset: level=${currentLevel}, totalTeamDeposit=${
            levelConfig.depositMin
          } at ${new Date(now).toISOString()}`
        );
      }
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});
