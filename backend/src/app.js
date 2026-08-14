import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import passport from "passport";
import { initializePassport } from "./config/passport.js";

import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Trust Render's reverse proxy so express-rate-limit can correctly identify client IPs
app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigin = process.env.CLIENT_URL;
if (!allowedOrigin && process.env.NODE_ENV === "production") {
  console.error("❌ CLIENT_URL is not set — CORS will fail in production");
}

app.use(
  cors({
    origin: allowedOrigin || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
initializePassport();
app.use(passport.initialize());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const makeLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const secondsLeft = Math.ceil(
        (req.rateLimit.resetTime - Date.now()) / 1000,
      );
      res
        .status(429)
        .json({ success: false, message, retryAfterSeconds: secondsLeft });
    },
  });

const generalLimiter = makeLimiter(
  15 * 60 * 1000,
  300,
  "Too many requests, try again later",
);
const strictAuthLimiter = makeLimiter(
  15 * 60 * 1000,
  20,
  "Too many attempts, try again later",
);
const refreshLimiter = makeLimiter(
  15 * 60 * 1000,
  200,
  "Too many requests, try again later",
);
const aiLimiter = makeLimiter(
  15 * 60 * 1000,
  50,
  "AI usage limit reached, try again later",
);

app.use("/api", generalLimiter);
app.use("/api/auth/refresh", refreshLimiter);
app.use("/api/auth", strictAuthLimiter);
app.use("/api/ai", aiLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
