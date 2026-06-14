import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"]) || 5001;
// Mute standard pino logs
logger.level = "silent";

app.listen(port, (err) => {
  if (err) {
    console.error("Error listening on port", err);
    process.exit(1);
  }

  console.log(`Frontend running at http://localhost:5173`);
  console.log(`Backend server running at http://localhost:${port}`);
});
