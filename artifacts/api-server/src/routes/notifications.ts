import { Router, type IRouter } from "express";
import { NotificationModel } from "@workspace/db";
import { SendNotificationBody, MarkNotificationReadParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { cacheMiddleware } from "../lib/cache";
import { invalidateCache } from "../lib/upstash";

const router: IRouter = Router();

router.get("/notifications", requireAuth, cacheMiddleware(60), async (req, res): Promise<void> => {
  const user = (req as any).user;
  const notifications = await NotificationModel.find({ userId: user.id.toString() }).sort({ createdAt: 1 }).lean();
  res.json(notifications.map(n => ({
    ...n,
    id: n._id.toString(),
    read: n.read === 1,
  })));
});

router.post("/notifications", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const notification = await NotificationModel.create({
    ...parsed.data,
    read: 0,
  });
  const n = notification.toObject();
  await invalidateCache("cache:*/notifications*");
  res.status(201).json({ ...n, id: n._id.toString(), read: n.read === 1 });
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const notification = await NotificationModel.findByIdAndUpdate(params.data.id, { read: 1 }, { new: true }).lean();
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    await invalidateCache("cache:*/notifications*");
    res.json({ ...notification, id: notification._id.toString(), read: notification.read === 1 });
  } catch (err) {
    res.status(404).json({ error: "Notification not found" });
  }
});

export default router;
