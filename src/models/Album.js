import mongoose from "mongoose";

const AlbumSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isPublic:    { type: Boolean, default: true },
    event:       { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Delete cached model to force fresh schema
delete mongoose.models.Album;

export default mongoose.model("Album", AlbumSchema);