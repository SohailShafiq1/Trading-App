import LeaderboardEntry from "../models/LeaderboardEntry.js";

// Create or update leaderboard entry
export const upsertLeaderboardEntry = async (req, res) => {
  try {
    const {
      userId,
      username,
      email,
      country,
      todayProfit,
      date,
      tradesCount,
      profitableTrades,
    } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ error: "userId and date are required" });
    }
    const entry = await LeaderboardEntry.findOneAndUpdate(
      { userId, date },
      {
        username,
        email,
        country,
        todayProfit,
        tradesCount,
        profitableTrades,
      },
      { upsert: true, new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to upsert leaderboard entry" });
  }
};

// Get leaderboard entries (optionally filter by date)
export const getLeaderboardEntries = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const entries = await LeaderboardEntry.find({ date }).sort({
      todayProfit: -1,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard entries" });
  }
};

// Delete leaderboard entry by ID
export const deleteLeaderboardEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await LeaderboardEntry.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete leaderboard entry" });
  }
};

// Update leaderboard entry by ID
export const updateLeaderboardEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userId,
      username,
      email,
      country,
      todayProfit,
      date,
      tradesCount,
      profitableTrades,
    } = req.body;
    const entry = await LeaderboardEntry.findByIdAndUpdate(
      id,
      {
        userId,
        username,
        email,
        country,
        todayProfit,
        date,
        tradesCount,
        profitableTrades,
      },
      { new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to update leaderboard entry" });
  }
};
