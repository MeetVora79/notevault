import express from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  googleAuth,
  googleCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);

// Google OAuth
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
