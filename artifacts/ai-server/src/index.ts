import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import pino from "pino";

import chatRoutes from "./routes/chat.js";
import pricingRoutes from "./routes/pricing.js";
import tasksRoutes from "./routes/tasks.js";

const app = express();
const PORT = process.env.AI_PORT || 5050;

const logger = pino({ name: "ai-server", level: "silent" });
app.use(pinoHttp({ logger }));

app.use(cors());
app.use(express.json());

app.use("/api", chatRoutes);
app.use("/api", pricingRoutes);
app.use("/api", tasksRoutes);

app.get("/", (req, res) => {
  res.send("<h1>Chat bot server running</h1>");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ai-server" });
});

app.listen(PORT, () => {
  console.log(`Chat bot server running at http://localhost:${PORT}`);
});
