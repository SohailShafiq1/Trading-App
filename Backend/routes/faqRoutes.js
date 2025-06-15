import express from "express";
import * as faqController from "../controllers/faqController.js";
// import { adminAuth } from "../middlewares/authMiddleware.js"; // Uncomment if you want to protect admin routes

const router = express.Router();

router.get("/", faqController.getAllFAQs);
router.post("/", faqController.createFAQ); // Add adminAuth as middleware if needed
router.delete("/:id", faqController.deleteFAQ); // Add adminAuth as middleware if needed
router.put("/:id", faqController.updateFAQ);
export default router;
