import mongoose from "mongoose";
import { z } from "zod";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "client" },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  phone: { type: String },
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.string().optional(),
  clientId: z.string().optional(),
  phone: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserType = mongoose.Document & InsertUser & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
