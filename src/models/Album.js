import mongoose from "mongoose";

const AlbumSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  isPublic:    { type: Boolean, default: true },
  event:       { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
}, { timestamps: true });

export default mongoose.models.Album || mongoose.model("Album", AlbumSchema);