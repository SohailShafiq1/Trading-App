import Affiliate from "../models/Affiliate.js";
import { PrizeArray } from "../controllers/affiliateController.js";

class AffiliateTimers {
  constructor(io) {
    this.io = io;
    this.timers = new Map(); // Stores interval timers for each affiliate
  }

  initialize() {
    console.log("🔔 Affiliate Timers service initialized");
  }

  // Start tracking timer for an affiliate
  startTimer(email) {
    if (this.timers.has(email)) {
      return; // Timer already exists
    }

    const interval = setInterval(async () => {
      try {
        const affiliate = await Affiliate.findOne({ email });
        if (!affiliate) {
          this.stopTimer(email);
          return;
        }

        const currentLevel = affiliate.level || 1;
        const prize = PrizeArray.find((l) => l.id === currentLevel);
        if (!prize) {
          this.stopTimer(email);
          return;
        }

        const timeElapsed =
          Date.now() - new Date(affiliate.levelStartTime).getTime();
        const timeLimitMs = prize.timeLimit * 24 * 60 * 60 * 1000;
        const timeLeft = Math.max(0, timeLimitMs - timeElapsed);

        // Check if time expired
        if (timeElapsed > timeLimitMs) {
          affiliate.level = 1;
          affiliate.levelStartTime = Date.now();
          await affiliate.save();

          this.io.to(email).emit("timerUpdate", {
            level: 1,
            timeLeft: PrizeArray[0].timeLimit * 24 * 60 * 60 * 1000,
            timeExpired: true,
          });
          return;
        }

        // Emit update to the specific affiliate
        this.io.to(email).emit("timerUpdate", {
          level: currentLevel,
          timeLeft,
          timeExpired: false,
          conditions: prize.conditions,
          currentDeposit: affiliate.totalDeposit,
          currentProfit: affiliate.totalProfit,
        });
      } catch (err) {
        console.error(`Error in timer for ${email}:`, err);
        this.stopTimer(email);
      }
    }, 1000); // Update every second

    this.timers.set(email, interval);
    console.log(`⏱️ Started timer for affiliate: ${email}`);
  }

  // Stop tracking timer for an affiliate
  stopTimer(email) {
    if (this.timers.has(email)) {
      clearInterval(this.timers.get(email));
      this.timers.delete(email);
      console.log(`⏹️ Stopped timer for affiliate: ${email}`);
    }
  }

  // Handle socket connection for an affiliate
  handleConnection(socket, email) {
    socket.join(email);
    this.startTimer(email);

    socket.on("disconnect", () => {
      console.log(`Client disconnected for affiliate: ${email}`);
      // Note: We don't stop the timer on disconnect to keep tracking
    });
  }
}

export default AffiliateTimers;
