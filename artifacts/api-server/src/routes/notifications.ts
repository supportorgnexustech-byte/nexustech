import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SendNotificationBody, MarkNotificationReadParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(notificationsTable.createdAt);
  res.json(notifications.map(n => ({
    ...n,
    read: n.read === 1,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.post("/notifications", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [notification] = await db.insert(notificationsTable).values({
    ...parsed.data,
    read: 0,
  }).returning();
  res.status(201).json({ ...notification, read: notification.read === 1, createdAt: notification.createdAt.toISOString() });
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notification] = await db.update(notificationsTable)
    .set({ read: 1 })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json({ ...notification, read: notification.read === 1, createdAt: notification.createdAt.toISOString() });
});

export default router;
