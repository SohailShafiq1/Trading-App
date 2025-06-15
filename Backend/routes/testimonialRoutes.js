import express from "express";
import * as testimonialController from "../controllers/testimonialController.js";

const router = express.Router();

router.get("/", testimonialController.getAllTestimonials);
router.post("/", testimonialController.createTestimonial);
router.delete("/:id", testimonialController.deleteTestimonial);
router.put("/:id", testimonialController.updateTestimonial);

export default router;
