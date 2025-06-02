import Settings from "../models/Settings.js";

// Get current withdraw auto-approve range
export const getWithdrawRange = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({
    min: settings.withdrawAutoApproveMin,
    max: settings.withdrawAutoApproveMax,
  });
};

// Update withdraw auto-approve range
export const setWithdrawRange = async (req, res) => {
  const { min, max } = req.body;

  // Convert to numbers and validate
  const minNum = Number(min);
  const maxNum = Number(max);

  if (isNaN(minNum) || isNaN(maxNum)) {
    return res.status(400).json({ error: "Invalid range values" });
  }

  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});

  settings.withdrawAutoApproveMin = minNum;
  settings.withdrawAutoApproveMax = maxNum;

  await settings.save();

  res.json({
    success: true,
    min: settings.withdrawAutoApproveMin,
    max: settings.withdrawAutoApproveMax,
  });
};

// Get current withdraw auto-approve limit
export const getWithdrawLimit = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({ limit: settings.withdrawAutoApproveLimit });
};

// Update withdraw auto-approve limit
export const setWithdrawLimit = async (req, res) => {
  const { limit } = req.body;
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  settings.withdrawAutoApproveLimit = Number(limit);
  await settings.save();
  res.json({ success: true, limit: settings.withdrawAutoApproveLimit });
};
