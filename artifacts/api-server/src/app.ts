import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.send("<h1>API Server is running</h1>");
});

app.use("/api", router);

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
  const publicPath = path.resolve(__dirname, "../../portal/dist/public");
  app.use(express.static(publicPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("<h1>Server is running</h1>");
  });
}

export default app;
