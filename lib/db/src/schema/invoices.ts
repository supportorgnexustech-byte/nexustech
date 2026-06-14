import mongoose from "mongoose";
import { z } from "zod";

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  projectId: { type: String },
  status: { type: String, default: "draft" },
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  amountPending: { type: Number, default: 0 },
  advancePayments: { 
    type: [{
      amount: Number,
      method: { type: String, enum: ["cash", "upi"] },
      date: String,
      receiptNumber: String
    }], 
    default: [] 
  },
  notes: { type: String },
  dueDate: { type: String, required: true },
  paidAt: { type: String },
}, { timestamps: true });

InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ clientId: 1, status: 1 });

export const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  clientId: z.union([z.string(), z.number()]),
  projectId: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  items: z.array(z.any()).optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  amountPaid: z.number().optional(),
  amountPending: z.number().optional(),
  advancePayments: z.array(z.object({
    amount: z.number(),
    method: z.enum(["cash", "upi"]),
    date: z.string(),
    receiptNumber: z.string()
  })).optional(),
  notes: z.string().optional(),
  dueDate: z.string(),
  paidAt: z.string().optional(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceType = mongoose.Document & InsertInvoice & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
