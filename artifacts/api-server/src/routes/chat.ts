import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  try {
    const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:5050";
    const response = await fetch(`${aiServerUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    logger.error({ err }, "Failed to proxy chat request to ai-server");
    res.status(502).json({ error: "AI service temporarily unavailable. Please try again." });
  }
});

export default router;
