import mongoose from "mongoose";
import { z } from "zod";

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  clientId: { type: String, required: true },
  status: { type: String, default: "planning" },
  priority: { type: String, default: "medium" },
  startDate: { type: String, required: true },
  endDate: { type: String },
  budget: { type: Number },
  spent: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  assignedDevIds: { type: [String], default: [] },
  githubRepoUrl: { type: String },
  featuresList: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ clientId: 1, status: 1 });

export const ProjectModel = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

const MilestoneSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: String, required: true },
  completed: { type: Number, default: 0 },
  completedAt: { type: String },
}, { timestamps: true });

MilestoneSchema.index({ projectId: 1 });

export const MilestoneModel = mongoose.models.Milestone || mongoose.model("Milestone", MilestoneSchema);

export const insertProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  clientId: z.union([z.string(), z.number()]),
  status: z.string().optional(),
  priority: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  spent: z.number().optional(),
  progress: z.number().optional(),
  assignedDevIds: z.array(z.union([z.string(), z.number()])).optional(),
  githubRepoUrl: z.string().optional(),
  featuresList: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean().optional()
  })).optional()
});

export const insertMilestoneSchema = z.object({
  projectId: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string(),
  completed: z.number().optional(),
  completedAt: z.string().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectType = mongoose.Document & InsertProject & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type MilestoneType = mongoose.Document & InsertMilestone & { _id: mongoose.Types.ObjectId, createdAt: Date, updatedAt: Date };
