import { Router, type IRouter } from "express";
import { EstimatePriceBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

router.post("/pricing/estimate", requireAuth, async (req, res): Promise<void> => {
  const parsed = EstimatePriceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: "AI pricing service not configured" });
    return;
  }

  const { description, clientType, timeline } = parsed.data;

  const prompt = `You are a senior software consultant at Nexus Tech Solutions, a tech company based in India. 
A client has described their project. Break it down into features and provide an itemized price estimate in INR (Indian Rupees).

Project Description: "${description}"
${clientType ? `Client Type: ${clientType}` : ""}
${timeline ? `Expected Timeline: ${timeline}` : ""}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "summary": "Brief 1-2 sentence summary of the project",
  "projectType": "Web App / Mobile App / API / SaaS / E-commerce / etc.",
  "complexity": "low | medium | high | enterprise",
  "features": [
    {
      "name": "Feature name",
      "description": "What this feature entails",
      "complexity": "low | medium | high",
      "minPrice": 15000,
      "maxPrice": 25000,
      "estimatedDays": 3
    }
  ],
  "totalEstimate": 150000,
  "minEstimate": 120000,
  "maxEstimate": 200000,
  "estimatedWeeks": 8,
  "currency": "INR"
}

Pricing guidelines (INR):
- Simple feature (form, list, basic CRUD): 8,000 - 20,000
- Medium feature (auth, dashboard, search): 25,000 - 60,000
- Complex feature (payment, real-time, AI): 60,000 - 1,50,000
- Enterprise feature (scalability, compliance): 1,50,000 - 5,00,000

Be realistic and helpful. Break into 4-8 distinct features.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ status: response.status, errText }, "Gemini API error");
      res.status(502).json({ error: "AI service temporarily unavailable" });
      return;
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const estimate = JSON.parse(cleaned);

    res.json({ ...estimate, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to generate pricing estimate");
    res.status(500).json({ error: "Failed to generate estimate. Please try again." });
  }
});

export default router;
