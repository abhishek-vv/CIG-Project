import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    url:         { type: String, required: true },
    publicId:    { type: String, required: true },
    type:        { type: String, enum: ["image", "video"], default: "image" },
    caption:     { type: String, trim: true },
    tags:        [{ type: String }],
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPublic:    { type: Boolean, default: true },
    album:       { type: mongoose.Schema.Types.ObjectId, ref: "Album",  required: true },
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    width:       { type: Number },
    height:      { type: Number },
    size:        { type: Number },
  },
  { timestamps: true }
);

delete mongoose.models.Media;
export default mongoose.model("Media", MediaSchema);