import { Router, type IRouter } from "express";
import { UserModel } from "@workspace/db";
import { CreateUserBody, GetUserParams, UpdateUserParams, UpdateUserBody, DeleteUserParams } from "@workspace/api-zod";
import { requireAuth, hashPassword } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const users = await UserModel.find().sort({ createdAt: 1 }).lean();
  res.json(users.map(({ passwordHash: _, ...u }: any) => ({ ...u, id: u._id.toString() })));
});

router.post("/users", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...rest } = parsed.data;
  const user = await UserModel.create({
    ...rest,
    passwordHash: hashPassword(password),
  });
  const userObj = user.toObject();
  const { passwordHash: _, ...safeUser } = userObj as any;
  safeUser.id = userObj._id.toString();
  res.status(201).json(safeUser);
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const user = await UserModel.findById(params.data.id).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash: _, ...safeUser } = user as any;
    safeUser.id = user._id.toString();
    res.json(safeUser);
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const user = await UserModel.findByIdAndUpdate(params.data.id, parsed.data, { new: true }).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash: _, ...safeUser } = user as any;
    safeUser.id = user._id.toString();
    res.json(safeUser);
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
});

router.delete("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const user = await UserModel.findByIdAndDelete(params.data.id).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
});

export default router;
