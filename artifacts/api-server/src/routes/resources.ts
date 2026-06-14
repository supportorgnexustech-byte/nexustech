import { Router, type IRouter } from "express";
import { ResourceModel, ProjectModel } from "@workspace/db";
import {
  ListResourcesQueryParams,
  CreateResourceBody,
  UpdateResourceParams,
  UpdateResourceBody,
  DeleteResourceParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function updateProjectSpent(projectId: string) {
  const resources = await ResourceModel.find({ projectId }).lean();
  const totalSpent = resources.reduce((sum, r) => sum + r.totalCost, 0);
  await ProjectModel.findByIdAndUpdate(projectId, { spent: totalSpent });
}

router.get("/resources/summary", requireAuth, async (_req, res): Promise<void> => {
  const resources = await ResourceModel.find().lean();
  const projects = await ProjectModel.find().lean();
  const projectMap = new Map(projects.map(p => [p._id.toString(), p]));

  let totalDevHours = 0, totalHostingCost = 0, totalToolsCost = 0, totalCost = 0;
  const byProjectMap = new Map<string, { projectId: string; projectName: string; devHours: number; hostingCost: number; toolsCost: number; totalCost: number }>();

  for (const r of resources) {
    const project = projectMap.get(r.projectId);
    if (!byProjectMap.has(r.projectId)) {
      byProjectMap.set(r.projectId, {
        projectId: r.projectId,
        projectName: project?.name ?? `Project ${r.projectId}`,
        devHours: 0, hostingCost: 0, toolsCost: 0, totalCost: 0,
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
    totalDevHours, totalHostingCost, totalToolsCost, totalCost,
    byProject: Array.from(byProjectMap.values()),
  });
});

router.get("/resources", requireAuth, async (req, res): Promise<void> => {
  const qp = ListResourcesQueryParams.safeParse(req.query);
  const conditions: any = {};
  if (qp.success && qp.data.projectId) conditions.projectId = qp.data.projectId.toString();

  const resources = await ResourceModel.find(conditions).sort({ date: 1 }).lean();
  const projects = await ProjectModel.find().lean();
  const projectMap = new Map(projects.map(p => [p._id.toString(), p]));

  res.json(resources.map(r => {
    const project = projectMap.get(r.projectId);
    return {
      ...r,
      id: r._id.toString(),
      projectName: project?.name ?? null,
      clientId: project?.clientId ?? null,
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
  const resource = await ResourceModel.create({ ...parsed.data, totalCost });
  const resourceObj = resource.toObject();
  
  await updateProjectSpent(resourceObj.projectId);
  
  const project = await ProjectModel.findById(resourceObj.projectId).lean();
  res.status(201).json({
    ...resourceObj,
    id: resourceObj._id.toString(),
    projectName: project?.name ?? null,
    clientId: project?.clientId ?? null,
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
  try {
    const resource = await ResourceModel.findByIdAndUpdate(params.data.id, updateData, { new: true }).lean();
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    
    await updateProjectSpent(resource.projectId);
    
    const project = await ProjectModel.findById(resource.projectId).lean();
    res.json({
      ...resource,
      id: resource._id.toString(),
      projectName: project?.name ?? null,
      clientId: project?.clientId ?? null,
    });
  } catch (err) {
    res.status(404).json({ error: "Resource not found" });
  }
});

router.delete("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const resource = await ResourceModel.findByIdAndDelete(params.data.id).lean();
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    
    await updateProjectSpent(resource.projectId);
    
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: "Resource not found" });
  }
});

export default router;
