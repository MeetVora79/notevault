import express from "express";
import { generateTitle } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/generate-title", generateTitle);

export default router;