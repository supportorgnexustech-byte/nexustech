import { Router, type IRouter } from "express";
import { db, tasksTable, projectsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichTask(task: typeof tasksTable.$inferSelect) {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId));
  let assigneeName: string | null = null;
  if (task.assigneeId) {
    const [assignee] = await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId));
    assigneeName = assignee?.name ?? null;
  }
  return {
    ...task,
    projectName: project?.name ?? null,
    assigneeName,
    dueDate: task.dueDate ?? null,
    createdAt: task.createdAt.toISOString(),
  };
}

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const qp = ListTasksQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success && qp.data.projectId) conditions.push(eq(tasksTable.projectId, qp.data.projectId));
  if (qp.success && qp.data.assigneeId) conditions.push(eq(tasksTable.assigneeId, qp.data.assigneeId));
  if (qp.success && qp.data.status) conditions.push(eq(tasksTable.status, qp.data.status));

  const tasks = await db.select().from(tasksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tasksTable.createdAt);

  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json(enriched);
});

router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values(parsed.data).returning();
  res.status(201).json(await enrichTask(task));
});

router.get("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(await enrichTask(task));
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
  const [task] = await db.update(tasksTable).set(parsed.data).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(await enrichTask(task));
});

router.delete("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
