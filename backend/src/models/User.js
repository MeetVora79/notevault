import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // never return password by default
    },
    googleId: {
  type: String,
  default: null,
},
    avatarColor: {
      type: String,
      default: () =>
        ["#4F46E5", "#0F766E", "#B45309", "#B91C1C", "#0369A1", "#7C3AED"][
          Math.floor(Math.random() * 6)
        ],
    },
    // SaaS-readiness fields (used in later phases)
    aiUsage: {
      titlesGenerated: { type: Number, default: 0 },
      summariesGenerated: { type: Number, default: 0 },
      chatMessages: { type: Number, default: 0 },
      lastResetAt: { type: Date, default: Date.now },
    },
    refreshTokens: [{ type: String, select: false }], // supports multi-device logout
  },
  { timestamps: true },
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Never leak sensitive fields in JSON responses
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
