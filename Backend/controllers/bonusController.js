// controllers/bonusController.js
import Bonus from "../models/Bonus.js";

// Get all bonuses
export const getAllBonuses = async (req, res) => {
  try {
    const bonuses = await Bonus.find();
    res.json(bonuses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bonuses" });
  }
};

// Add a new bonus
export const createBonus = async (req, res) => {
  try {
    const { min, percent } = req.body;
    if (!min || !percent) {
      return res.status(400).json({ error: "All fields required" });
    }
    const bonus = new Bonus({ min, percent });
    await bonus.save();
    res.status(201).json(bonus);
  } catch (error) {
    res.status(500).json({ error: "Failed to create bonus" });
  }
};

// Delete a bonus
export const deleteBonus = async (req, res) => {
  try {
    const deletedBonus = await Bonus.findByIdAndDelete(req.params.id);
    if (!deletedBonus) {
      return res.status(404).json({ error: "Bonus not found" });
    }
    res.json({ success: true, message: "Bonus deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bonus" });
  }
};

// Update a bonus
export const updateBonus = async (req, res) => {
  try {
    const { min, percent } = req.body;
    const bonus = await Bonus.findByIdAndUpdate(
      req.params.id,
      { min, percent },
      { new: true }
    );
    if (!bonus) {
      return res.status(404).json({ error: "Bonus not found" });
    }
    res.json(bonus);
  } catch (error) {
    res.status(500).json({ error: "Failed to update bonus" });
  }
};
