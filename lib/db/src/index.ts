import mongoose from "mongoose";
import * as schema from "./schema/index.js";

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexus";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB Connected details: successfully connected to local database"))
  .catch((err) => console.error("MongoDB connection error:", err));

export const db = mongoose;
export * from "./schema/index.js";
