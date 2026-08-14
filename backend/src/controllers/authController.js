import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} from "../utils/generateTokens.js";
import passport from "../config/passport.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/sendEmail.js";

// @desc   Register new user
// @route  POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }

  // Name validation
  if (name.trim().length < 2) {
    res.status(400);
    throw new Error("Name must be at least 2 characters");
  }

  if (name.trim().length > 60) {
    res.status(400);
    throw new Error("Name must be less than 60 characters");
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    res.status(400);
    throw new Error(
      "Name can only contain letters, spaces, hyphens and apostrophes",
    );
  }

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  // Password validation
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  if (password.trim() !== password) {
    res.status(400);
    throw new Error("Password cannot start or end with spaces");
  }

  if (/^\s+$/.test(password)) {
    res.status(400);
    throw new Error("Password cannot be only spaces");
  }

  if (!/(?=.*[a-zA-Z])/.test(password)) {
    res.status(400);
    throw new Error("Password must contain at least one letter");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens = [refreshToken];
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc   Login user
// @route  POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const user = await User.findOne({ email }).select("+password +refreshTokens");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc   Refresh access token using httpOnly refresh cookie
// @route  POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("No refresh token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error("Refresh token invalid or expired, please log in again");
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");

  if (!user || !user.refreshTokens.includes(token)) {
    res.status(401);
    throw new Error("Refresh token not recognized, please log in again");
  }

  // Rotate refresh token for better security
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshTokens = user.refreshTokens
    .filter((t) => t !== token)
    .concat(newRefreshToken);
  await user.save();

  setRefreshTokenCookie(res, newRefreshToken);

  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({
    success: true,
    accessToken: newAccessToken,
  });
});

// @desc   Logout user (invalidate current refresh token)
// @route  POST /api/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token && req.user) {
    req.user.refreshTokens = (req.user.refreshTokens || []).filter(
      (t) => t !== token,
    );
    await req.user.save();
  }

  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// @desc   Get current logged-in user
// @route  GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// @desc   Redirect to Google OAuth
// @route  GET /api/auth/google
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

// @desc   Google OAuth callback
// @route  GET /api/auth/google/callback
export const googleCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, data) => {
    if (err || !data) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
      );
    }

    const { user, appAccessToken, appRefreshToken } = data;

    res.cookie("refreshToken", appRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${appAccessToken}`,
    );
  })(req, res, next);
});

// @desc   Set password for Google-only accounts
// @route  PATCH /api/auth/set-password
// @access Private
export const setPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (user.password) {
    res.status(400);
    throw new Error("Password already set — use change password instead");
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password set successfully",
  });
});

// @desc   Change existing password
// @route  PATCH /api/auth/change-password
// @access Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new password are required");
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user.password) {
    res.status(400);
    throw new Error("No password set — use set password instead");
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc   Update profile (name, avatarColor)
// @route  PATCH /api/auth/update-profile
// @access Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarColor } = req.body;

  if (name !== undefined) req.user.name = name.trim();
  if (avatarColor !== undefined) req.user.avatarColor = avatarColor;

  await req.user.save();

  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

// @desc   Send password reset email
// @route  POST /api/auth/forgot-password
// @access Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("1. Forgot password request for:", email);
  if (!email) {
    res.status(400);
    throw new Error("Please provide your email address");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+resetPasswordToken +resetPasswordExpires +password",
  );
  console.log("2. User found:", !!user);
  // Always return success even if email not found — prevents email enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent",
    });
  }
  console.log(
    "3. Has password:",
    !!user.password,
    "Has googleId:",
    !!user.googleId,
  );

  // Only skip if user has absolutely no password (pure Google user)
  // If they set a password via Settings, allow reset even if they have googleId
  if (!user.password) {
    console.log("4. No password set for this account, skipping");
    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent",
    });
  }

  // Generate reset token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();
  console.log("5. Token saved, sending email to:", user.email);

  try {
    const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${rawToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
    console.log("6. Email sent successfully");
  } catch (emailErr) {
    console.error("6. Email send FAILED:", emailErr.message);
  }

  res.status(200).json({
    success: true,
    message: "If an account exists with this email, a reset link has been sent",
  });
});

// @desc   Reset password using token from email
// @route  POST /api/auth/reset-password
// @access Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Token and new password are required");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  if (password.trim() !== password || /^\s+$/.test(password)) {
    res.status(400);
    throw new Error("Password cannot start or end with spaces");
  }

  if (!/(?=.*[a-zA-Z])/.test(password)) {
    res.status(400);
    throw new Error("Password must contain at least one letter");
  }

  // Hash the raw token from URL to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }, // not expired
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired");
  }

  // Update password and clear reset token
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();

  res.status(200).json({
    success: true,
    message:
      "Password reset successfully — you can now log in with your new password",
  });
});
