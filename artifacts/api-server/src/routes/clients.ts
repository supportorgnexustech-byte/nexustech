import { Router, type IRouter } from "express";
import { ClientModel, ProjectModel, TaskModel, InvoiceModel, ResourceModel } from "@workspace/db";
import { CreateClientBody, GetClientParams, UpdateClientParams, UpdateClientBody, DeleteClientParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/clients", requireAuth, async (_req, res): Promise<void> => {
  const clients = await ClientModel.find().sort({ createdAt: 1 }).lean();
  res.json(clients.map(c => ({ ...c, id: c._id.toString() })));
});

router.post("/clients", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const client = await ClientModel.create(parsed.data);
  const clientObj = client.toObject();
  res.status(201).json({ ...clientObj, id: clientObj._id.toString() });
});

router.get("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const client = await ClientModel.findById(params.data.id).lean();
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ ...client, id: client._id.toString() });
  } catch (err) {
    res.status(404).json({ error: "Client not found" });
  }
});

router.patch("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const client = await ClientModel.findByIdAndUpdate(params.data.id, parsed.data, { new: true }).lean();
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ ...client, id: client._id.toString() });
  } catch (err) {
    res.status(404).json({ error: "Client not found" });
  }
});

router.delete("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const client = await ClientModel.findByIdAndDelete(params.data.id).lean();
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    // Cascade delete related entities
    const projects = await ProjectModel.find({ clientId: params.data.id }, { _id: 1 });
    const projectIds = projects.map(p => p._id.toString());
    
    if (projectIds.length > 0) {
      await TaskModel.deleteMany({ projectId: { $in: projectIds } });
    }
    await ProjectModel.deleteMany({ clientId: params.data.id });
    await InvoiceModel.deleteMany({ clientId: params.data.id });
    await ResourceModel.deleteMany({ clientId: params.data.id });

    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: "Client not found" });
  }
});

export default router;
