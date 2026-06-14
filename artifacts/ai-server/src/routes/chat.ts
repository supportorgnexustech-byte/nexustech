import { Router, type IRouter } from "express";
import { fallbackLLM } from "../lib/llm-fallback.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Nexus AI, a friendly and helpful assistant for Nexus Tech Solutions — a tech services company based in India.

You help team members with:
- Project management questions and best practices
- Technical guidance on web/mobile development, cloud, and AI/ML
- Business queries about pricing, timelines, and resource planning
- General tech industry insights

Keep responses concise, professional, and actionable. Use bullet points when listing items. 
When discussing pricing, use INR (₹). Be warm and supportive.`;

router.post("/chat", async (req, res): Promise<void> => {
  const { message, history } = req.body as { message?: string; history?: Array<{ role: string; content: string }> };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  let prompt = `${SYSTEM_PROMPT}\n\nConversation History:\n`;
  if (history && Array.isArray(history)) {
    const recent = history.slice(-10);
    for (const msg of recent) {
      prompt += `${msg.role === "user" ? "User" : "AI"}: ${msg.content}\n`;
    }
  }
  prompt += `User: ${message}\nAI:`;

  try {
    const reply = await fallbackLLM(prompt, { maxTokens: 1024, temperature: 0.7 });
    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err: any) {
    if (err.message === "ALL_LLMS_FAILED") {
      const fallbacks = [
        "I'm currently experiencing high demand and having trouble connecting to my main systems. However, I can still help you with basic queries or point you to project dashboards.",
        "It seems I'm operating in an offline/fallback mode due to high traffic limits on the AI service. Could you try your request again in a few minutes?",
        "I've hit my rate limits at the moment. As a fallback, please check the main analytics dashboard for project statuses and details."
      ];
      res.json({
        reply: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        timestamp: new Date().toISOString()
      });
      return;
    }
    res.status(500).json({ error: "Failed to generate chat response." });
  }
});

export default router;
