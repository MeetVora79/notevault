import express from "express";
import { generateTitle, summarizeNote } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/generate-title", generateTitle);
router.post("/summarize", summarizeNote);

export default router;
