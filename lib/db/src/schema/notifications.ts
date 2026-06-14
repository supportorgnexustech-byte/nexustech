import mongoose from "mongoose";
import { z } from "zod";

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, default: "system" },
  channel: { type: String, default: "in_app" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Number, default: 0 },
  entityId: { type: String },
}, { timestamps: true });

export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export const insertNotificationSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  type: z.string().optional(),
  channel: z.string().optional(),
  title: z.string(),
  message: z.string(),
  read: z.number().optional(),
  entityId: z.union([z.string(), z.number()]).optional(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationType = mongoose.Document & InsertNotification & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
