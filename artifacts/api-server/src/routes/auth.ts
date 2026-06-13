import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, generateToken, storeToken, invalidateToken, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = generateToken(user.id);
  storeToken(token, user.id);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() }, token });
});

router.post("/auth/logout", requireAuth, (req, res): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    invalidateToken(authHeader.slice(7));
  }
  res.sendStatus(204);
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
});

export default router;
