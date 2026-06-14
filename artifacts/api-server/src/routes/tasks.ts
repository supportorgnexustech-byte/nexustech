import { Router, type IRouter } from "express";
import { TaskModel, ProjectModel, UserModel } from "@workspace/db";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";
import { cacheMiddleware } from "../lib/cache";
import { invalidateCache } from "../lib/upstash";

const router: IRouter = Router();

async function enrichTask(task: any) {
  const project = await ProjectModel.findById(task.projectId).lean();
  let assigneeName: string | null = null;
  if (task.assigneeId) {
    const assignee = await UserModel.findById(task.assigneeId).lean();
    assigneeName = assignee?.name ?? null;
  }
  return {
    ...task,
    id: task._id.toString(),
    projectName: project?.name ?? null,
    assigneeName,
    dueDate: task.dueDate ?? null,
  };
}

router.get("/tasks", requireAuth, cacheMiddleware(60), async (req, res): Promise<void> => {
  const qp = ListTasksQueryParams.safeParse(req.query);
  const conditions: any = {};
  if (qp.success && qp.data.projectId) conditions.projectId = qp.data.projectId.toString();
  if (qp.success && qp.data.assigneeId) conditions.assigneeId = qp.data.assigneeId.toString();
  if (qp.success && qp.data.status) conditions.status = qp.data.status;

  const tasks = await TaskModel.find(conditions).sort({ createdAt: 1 }).lean();
  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json(enriched);
});

router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const task = await TaskModel.create(parsed.data);
  await invalidateCache('cache:/api/tasks*');
  res.status(201).json(await enrichTask(task.toObject()));
});

router.post("/tasks/generate", requireAuth, async (req, res): Promise<void> => {
  const { projectId, featureId, featureTitle, projectDescription } = req.body;
  if (!projectId || !featureId || !featureTitle || !projectDescription) {
    res.status(400).json({ error: "Missing required fields for generation." });
    return;
  }

  try {
    const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:5050";
    const response = await fetch(`${aiServerUrl}/api/tasks/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureTitle, projectDescription }),
    });
    
    if (!response.ok) {
      throw new Error(`AI server responded with ${response.status}`);
    }

    const aiTasks = await response.json() as any[];
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // Due in 3 days by default

    const tasksToInsert = aiTasks.map((t: any) => ({
      title: t.title,
      description: t.description,
      priority: t.priority || "medium",
      estimatedHours: t.estimatedHours || 2,
      projectId,
      featureId,
      status: "todo",
      dueDate: dueDate.toISOString(),
    }));

    const inserted = await TaskModel.insertMany(tasksToInsert);
    await invalidateCache('cache:/api/tasks*');
    const enriched = await Promise.all(inserted.map(t => enrichTask(t.toObject())));
    res.status(201).json(enriched);
  } catch (err) {
    logger.error({ err }, "Failed to generate tasks via ai-server");
    res.status(502).json({ error: "AI task generation failed." });
  }
});

router.get("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const task = await TaskModel.findById(params.data.id).lean();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(await enrichTask(task));
  } catch (err) {
    res.status(404).json({ error: "Task not found" });
  }
});

router.patch("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const task = await TaskModel.findByIdAndUpdate(params.data.id, parsed.data, { new: true }).lean();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    await invalidateCache('cache:/api/tasks*');
    res.json(await enrichTask(task));
  } catch (err) {
    res.status(404).json({ error: "Task not found" });
  }
});

router.delete("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const task = await TaskModel.findByIdAndDelete(params.data.id).lean();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    await invalidateCache('cache:/api/tasks*');
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: "Task not found" });
  }
});

export default router;
