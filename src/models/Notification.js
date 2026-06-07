import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type:    {
      type: String,
      enum: ["like", "comment", "tag", "follow"],
      required: true,
    },
    message:  { type: String, required: true },
    read:     { type: Boolean, default: false },
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    media:    { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
  },
  { timestamps: true }
);

delete mongoose.models.Notification;
export default mongoose.model("Notification", NotificationSchema);