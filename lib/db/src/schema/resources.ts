import mongoose from "mongoose";
import { z } from "zod";

const ResourceSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  type: { type: String, default: "dev_hours" },
  description: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  costPerUnit: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  date: { type: String, required: true },
}, { timestamps: true });

ResourceSchema.index({ projectId: 1 });
ResourceSchema.index({ type: 1 });

export const ResourceModel = mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

export const insertResourceSchema = z.object({
  projectId: z.union([z.string(), z.number()]),
  type: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  costPerUnit: z.number(),
  totalCost: z.number(),
  date: z.string(),
});

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ResourceType = mongoose.Document & InsertResource & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
