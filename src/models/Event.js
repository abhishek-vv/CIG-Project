import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category:    {
      type: String,
      enum: ["photoshoot", "workshop", "trip", "competition", "fest", "party", "other"],
      default: "other",
    },
    date:        { type: Date, required: true },
    isPublic:    { type: Boolean, default: true },
    coverImage:  { type: String, default: null },
    club:        { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);