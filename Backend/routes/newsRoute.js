import {
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
} from "../controllers/newsController.js";

import express from "express";
const router = express.Router();

router.get("/", getAllNews);
router.post("/", createNews);
router.put("/:id", updateNews);
router.delete("/:id", deleteNews);

export default router;
