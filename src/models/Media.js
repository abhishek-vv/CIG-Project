import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema({
  url:         { type: String, required: true },
  publicId:    { type: String, required: true },
  type:        { type: String, default: "image" },
  caption:     { type: String },
  tags:        [{ type: String }],
  isPublic:    { type: Boolean, default: true },
  album:       { type: mongoose.Schema.Types.ObjectId, ref: "Album", required: true },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);