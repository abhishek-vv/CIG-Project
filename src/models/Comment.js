import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  media:   { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: true },
}, { timestamps: true });

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);