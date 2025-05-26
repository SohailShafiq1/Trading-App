import express from "express";
import Bonus from "../models/Bonus.js";
const router = express.Router();

// Get all bonuses
router.get("/", async (req, res) => {
  const bonuses = await Bonus.find();
  res.json(bonuses);
});

// Add a new bonus
router.post("/", async (req, res) => {
  const { min, percent } = req.body;
  if (!min || !percent) return res.status(400).json({ error: "All fields required" });
  const bonus = new Bonus({ min, percent });
  await bonus.save();
  res.status(201).json(bonus);
});

// Delete a bonus
router.delete("/:id", async (req, res) => {
  await Bonus.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Update a bonus
router.put("/:id", async (req, res) => {
  const { min, percent } = req.body;
  const bonus = await Bonus.findByIdAndUpdate(
    req.params.id,
    { min, percent },
    { new: true }
  );
  res.json(bonus);
});

export default router;