import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  type:    { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);