import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    image:    { type: String, default: null },
    // Global role — only SUPER_ADMIN can manage the whole platform
    role:     {
      type:    String,
      enum:    ["USER", "SUPER_ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);