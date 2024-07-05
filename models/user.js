const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String, // For password reset token
    resetPasswordExpires: Date, // For password reset token expiration
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
