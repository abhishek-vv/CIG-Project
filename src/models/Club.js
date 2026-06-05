import mongoose from "mongoose";

const ClubSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    category:    {
      type: String,
      enum: ["technical", "cultural", "sports", "photography", "music", "dance", "other"],
      default: "other",
    },
    logo:     { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Invite codes
    memberCode:      { type: String, unique: true, sparse: true },
    photographerCode:{ type: String, unique: true, sparse: true },

    members: [
      {
        user:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role:     {
          type:    String,
          enum:    ["ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER"],
          default: "CLUB_MEMBER",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Club || mongoose.model("Club", ClubSchema);