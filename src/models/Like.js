import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: true },
}, { timestamps: true });

LikeSchema.index({ user: 1, media: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model("Like", LikeSchema);