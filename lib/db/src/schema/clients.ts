import mongoose from "mongoose";
import { z } from "zod";

const ClientSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  businessType: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String },
  services: { type: [String], default: [] },
  status: { type: String, default: "onboarding" },
  address: { type: String },
  gstin: { type: String },
}, { timestamps: true });

ClientSchema.index({ status: 1 });
ClientSchema.index({ companyName: 1 });

export const ClientModel = mongoose.models.Client || mongoose.model("Client", ClientSchema);

export const insertClientSchema = z.object({
  companyName: z.string(),
  businessType: z.string(),
  contactName: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  services: z.array(z.string()).optional(),
  status: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type ClientType = mongoose.Document & InsertClient & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
