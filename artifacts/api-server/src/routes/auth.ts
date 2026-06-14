import { Router, type IRouter } from "express";
import { UserModel } from "@workspace/db";
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
  const user = await UserModel.findOne({ email }).lean();
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = generateToken(user._id.toString() as any);
  storeToken(token, user._id.toString() as any);
  const { passwordHash: _, ...safeUser } = user as any;
  safeUser.id = user._id.toString();
  res.json({ user: safeUser, token });
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
  res.json(safeUser);
});

export default router;
