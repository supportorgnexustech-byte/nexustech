import { Router } from "express";
import { fallbackLLM } from "../lib/llm-fallback";

const router = Router();

router.post("/tasks/generate", async (req, res) => {
  const { featureTitle, projectDescription } = req.body;

  if (!featureTitle || !projectDescription) {
    return res.status(400).json({ error: "Missing featureTitle or projectDescription" });
  }

  const prompt = `You are a technical project manager for Nexus Tech Solutions.
The team is working on a software project.
Project Description: "${projectDescription}"

The current feature to implement is: "${featureTitle}"

Generate EXACTLY 5 to 6 specific development tasks required to complete this feature.
Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
[
  {
    "title": "Task title (e.g. Setup Database Schema)",
    "description": "Brief description of the task",
    "priority": "medium",
    "estimatedHours": 2
  }
]
`;

  try {
    const text = await fallbackLLM(prompt, { maxTokens: 1024, temperature: 0.4 });
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const tasks = JSON.parse(cleaned);

    res.json(tasks);
  } catch (err: any) {
    console.error("AI Task Generation error:", err);
    
    // Fallback if AI fails
    res.json([
      { title: `Analyze Requirements for ${featureTitle}`, description: `Understand the scope and requirements for ${featureTitle}.`, priority: "medium", estimatedHours: 2 },
      { title: `Design UI/UX for ${featureTitle}`, description: `Create wireframes and designs.`, priority: "medium", estimatedHours: 4 },
      { title: `Implement Backend Logic for ${featureTitle}`, description: `Write the server-side code and API endpoints.`, priority: "high", estimatedHours: 6 },
      { title: `Develop Frontend Components for ${featureTitle}`, description: `Build the UI components and integrate with backend.`, priority: "high", estimatedHours: 8 },
      { title: `Test and QA ${featureTitle}`, description: `Perform unit and integration testing.`, priority: "low", estimatedHours: 3 },
    ]);
  }
});

export default router;
