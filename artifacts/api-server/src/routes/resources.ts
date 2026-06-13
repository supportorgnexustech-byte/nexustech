import { Router, type IRouter } from "express";
import { db, resourcesTable, projectsTable, clientsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListResourcesQueryParams,
  CreateResourceBody,
  UpdateResourceParams,
  UpdateResourceBody,
  DeleteResourceParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/resources/summary", requireAuth, async (_req, res): Promise<void> => {
  const resources = await db.select().from(resourcesTable);
  const projects = await db.select().from(projectsTable);
  const projectMap = new Map(projects.map(p => [p.id, p]));

  let totalDevHours = 0, totalHostingCost = 0, totalToolsCost = 0, totalCost = 0;
  const byProjectMap = new Map<number, { projectId: number; projectName: string; devHours: number; hostingCost: number; toolsCost: number; totalCost: number }>();

  for (const r of resources) {
    const project = projectMap.get(r.projectId);
    if (!byProjectMap.has(r.projectId)) {
      byProjectMap.set(r.projectId, {
        projectId: r.projectId,
        projectName: project?.name ?? `Project ${r.projectId}`,
        devHours: 0,
        hostingCost: 0,
        toolsCost: 0,
        totalCost: 0,
      });
    }
    const entry = byProjectMap.get(r.projectId)!;
    if (r.type === "dev_hours") { totalDevHours += r.quantity; entry.devHours += r.quantity; }
    else if (r.type === "hosting") { totalHostingCost += r.totalCost; entry.hostingCost += r.totalCost; }
    else if (r.type === "tools" || r.type === "licenses") { totalToolsCost += r.totalCost; entry.toolsCost += r.totalCost; }
    totalCost += r.totalCost;
    entry.totalCost += r.totalCost;
  }

  res.json({
    totalDevHours,
    totalHostingCost,
    totalToolsCost,
    totalCost,
    byProject: Array.from(byProjectMap.values()),
  });
});

router.get("/resources", requireAuth, async (req, res): Promise<void> => {
  const qp = ListResourcesQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success && qp.data.projectId) conditions.push(eq(resourcesTable.projectId, qp.data.projectId));

  const resources = await db.select().from(resourcesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(resourcesTable.date);

  const projects = await db.select().from(projectsTable);
  const projectMap = new Map(projects.map(p => [p.id, p]));

  res.json(resources.map(r => {
    const project = projectMap.get(r.projectId);
    return {
      ...r,
      projectName: project?.name ?? null,
      clientId: project?.clientId ?? null,
      date: r.date,
      createdAt: r.createdAt.toISOString(),
    };
  }));
});

router.post("/resources", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const totalCost = parsed.data.quantity * parsed.data.costPerUnit;
  const [resource] = await db.insert(resourcesTable).values({
    ...parsed.data,
    totalCost,
  }).returning();
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, resource.projectId));
  res.status(201).json({
    ...resource,
    projectName: project?.name ?? null,
    clientId: project?.clientId ?? null,
    date: resource.date,
    createdAt: resource.createdAt.toISOString(),
  });
});

router.patch("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: any = { ...parsed.data };
  if (parsed.data.quantity !== undefined && parsed.data.costPerUnit !== undefined) {
    updateData.totalCost = parsed.data.quantity * parsed.data.costPerUnit;
  }
  const [resource] = await db.update(resourcesTable).set(updateData).where(eq(resourcesTable.id, params.data.id)).returning();
  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, resource.projectId));
  res.json({
    ...resource,
    projectName: project?.name ?? null,
    clientId: project?.clientId ?? null,
    date: resource.date,
    createdAt: resource.createdAt.toISOString(),
  });
});

router.delete("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [resource] = await db.delete(resourcesTable).where(eq(resourcesTable.id, params.data.id)).returning();
  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
