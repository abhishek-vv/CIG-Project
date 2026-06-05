import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Club from "@/models/Club";

export async function POST(req) {
  try {
    const { name, email, password, inviteCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // If invite code provided, validate it
    let clubToJoin = null;
    let clubRole   = null;

    if (inviteCode && inviteCode.trim() !== "") {
      const code = inviteCode.trim().toUpperCase();

      // Check member code
      clubToJoin = await Club.findOne({ memberCode: code });
      if (clubToJoin) {
        clubRole = "CLUB_MEMBER";
      }

      // Check photographer code
      if (!clubToJoin) {
        clubToJoin = await Club.findOne({ photographerCode: code });
        if (clubToJoin) {
          clubRole = "PHOTOGRAPHER";
        }
      }

      // Code provided but not valid
      if (!clubToJoin) {
        return NextResponse.json(
          { error: "Invalid invite code" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "USER",
    });

    // If valid invite code, auto join the club
    if (clubToJoin && clubRole) {
      clubToJoin.members.push({
        user:     user._id,
        role:     clubRole,
        joinedAt: new Date(),
      });
      await clubToJoin.save();
    }

    return NextResponse.json(
      {
        message: clubToJoin
          ? `Account created and joined ${clubToJoin.name} as ${clubRole}`
          : "Account created successfully",
        userId: user._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}