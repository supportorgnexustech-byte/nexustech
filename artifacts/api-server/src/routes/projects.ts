import { Router, type IRouter } from "express";
import { ProjectModel, MilestoneModel, ClientModel, TaskModel } from "@workspace/db";
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

function enrichProject(project: any, clientName: string | null) {
  return {
    ...project,
    id: project._id.toString(),
    clientName,
    endDate: project.endDate ?? null,
  };
}

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const qp = ListProjectsQueryParams.safeParse(req.query);
  const conditions: any = {};
  if (qp.success && qp.data.clientId) conditions.clientId = qp.data.clientId.toString();
  if (qp.success && qp.data.status) conditions.status = qp.data.status;

  const projects = await ProjectModel.find(conditions).sort({ createdAt: 1 }).lean();
  const clients = await ClientModel.find().lean();
  const clientMap = new Map(clients.map(c => [c._id.toString(), c.companyName]));

  res.json(projects.map(p => enrichProject(p, clientMap.get(p.clientId as string) ?? null)));
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const project = await ProjectModel.create(parsed.data);
  const projectObj = project.toObject();
  const client = await ClientModel.findById(projectObj.clientId).lean();
  res.status(201).json(enrichProject(projectObj, client?.companyName ?? null));
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const project = await ProjectModel.findById(params.data.id).lean();
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const client = await ClientModel.findById(project.clientId).lean();
    res.json(enrichProject(project, client?.companyName ?? null));
  } catch (err) {
    res.status(404).json({ error: "Project not found" });
  }
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
  try {
    const updateData = { ...parsed.data };
    
    // Auto-calculate progress if featuresList is being updated
    if (updateData.featuresList && Array.isArray(updateData.featuresList)) {
      const total = updateData.featuresList.length;
      if (total > 0) {
        const completed = updateData.featuresList.filter((f: any) => f.completed).length;
        updateData.progress = Math.round((completed / total) * 100);
      } else {
        updateData.progress = 0;
      }
    }

    const project = await ProjectModel.findByIdAndUpdate(params.data.id, updateData, { new: true }).lean();
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const client = await ClientModel.findById(project.clientId).lean();
    res.json(enrichProject(project, client?.companyName ?? null));
  } catch (err) {
    res.status(404).json({ error: "Project not found" });
  }
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const project = await ProjectModel.findByIdAndDelete(params.data.id).lean();
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    // Cascade delete tasks
    await TaskModel.deleteMany({ projectId: params.data.id });
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: "Project not found" });
  }
});

router.get("/projects/:id/milestones", requireAuth, async (req, res): Promise<void> => {
  const params = ListProjectMilestonesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const milestones = await MilestoneModel.find({ projectId: params.data.id.toString() }).sort({ dueDate: 1 }).lean();
    res.json(milestones.map(m => ({
      ...m,
      id: m._id.toString(),
      completed: m.completed === 1,
      completedAt: m.completedAt ?? null,
    })));
  } catch (err) {
    res.status(404).json({ error: "Milestones not found" });
  }
});

export default router;
