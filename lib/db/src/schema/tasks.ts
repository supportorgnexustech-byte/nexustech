import mongoose from "mongoose";
import { z } from "zod";

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  projectId: { type: String, required: true },
  featureId: { type: String },
  assigneeId: { type: String },
  status: { type: String, default: "todo" },
  priority: { type: String, default: "medium" },
  dueDate: { type: String },
  estimatedHours: { type: Number },
  loggedHours: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
}, { timestamps: true });

TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assigneeId: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ projectId: 1, status: 1 });

export const TaskModel = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export const insertTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  projectId: z.union([z.string(), z.number()]),
  featureId: z.union([z.string(), z.number()]).optional(),
  assigneeId: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  loggedHours: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskType = mongoose.Document & InsertTask & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
