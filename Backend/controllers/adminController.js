let currentTrend = "Normal";

export const setTrend = (req, res) => {
  const { mode } = req.body;
  currentTrend = mode;
  res.status(200).json({ message: "Trend updated", trend: currentTrend });
};

export const getTrend = (req, res) => {
  res.status(200).json({ trend: currentTrend });
};
