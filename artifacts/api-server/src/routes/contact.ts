import { Router, Request, Response } from "express";
import { upstashRedis } from "../lib/upstash";

const router = Router();

router.post("/contact", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Publish the contact message to a Redis list or pub/sub queue
    const payload = JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
      message,
      timestamp: new Date().toISOString()
    });

    // Using Upstash Redis RPUSH to add to a queue for the notification-server to process
    await upstashRedis.rpush("contact:notifications", payload);

    res.json({ success: true });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

export default router;
