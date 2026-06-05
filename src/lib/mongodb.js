import "server-only";
import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("DB already connected");
    return;
  }

  try {
    const { connection } = await mongoose.connect(process.env.DATABASE_URL, {
      dbName: "media_platform",
    });

    isConnected = true;
    console.log("DB connected:", connection.host);
  } catch (error) {
    console.log("Failed to connect to database");
    console.log(error);
  }
};