import { Router, type IRouter } from "express";
import { db, projectsTable, milestonesTable, clientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  ListProjectMilestonesParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const qp = ListProjectsQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success && qp.data.clientId) conditions.push(eq(projectsTable.clientId, qp.data.clientId));
  if (qp.success && qp.data.status) conditions.push(eq(projectsTable.status, qp.data.status));

  const projects = await db.select().from(projectsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(projectsTable.createdAt);

  const clients = await db.select().from(clientsTable);
  const clientMap = new Map(clients.map(c => [c.id, c.companyName]));

  res.json(projects.map(p => ({
    ...p,
    clientName: clientMap.get(p.clientId) ?? null,
    startDate: p.startDate,
    endDate: p.endDate ?? null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.insert(projectsTable).values(parsed.data).returning();
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, project.clientId));
  res.status(201).json({
    ...project,
    clientName: client?.companyName ?? null,
    startDate: project.startDate,
    endDate: project.endDate ?? null,
    createdAt: project.createdAt.toISOString(),
  });
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, project.clientId));
  res.json({
    ...project,
    clientName: client?.companyName ?? null,
    startDate: project.startDate,
    endDate: project.endDate ?? null,
    createdAt: project.createdAt.toISOString(),
  });
});

router.patch("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.update(projectsTable).set(parsed.data).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, project.clientId));
  res.json({
    ...project,
    clientName: client?.companyName ?? null,
    startDate: project.startDate,
    endDate: project.endDate ?? null,
    createdAt: project.createdAt.toISOString(),
  });
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:id/milestones", requireAuth, async (req, res): Promise<void> => {
  const params = ListProjectMilestonesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const milestones = await db.select().from(milestonesTable)
    .where(eq(milestonesTable.projectId, params.data.id))
    .orderBy(milestonesTable.dueDate);
  res.json(milestones.map(m => ({
    ...m,
    completed: m.completed === 1,
    completedAt: m.completedAt?.toISOString() ?? null,
  })));
});

export default router;
