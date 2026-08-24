import express from "express";
import {
  generateTitle,
  summarizeNote,
  chatWithNotes,
  organizeNote,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/generate-title", generateTitle);
router.post("/summarize", summarizeNote);
router.post("/chat", chatWithNotes);
router.post("/organize", organizeNote);

export default router;
