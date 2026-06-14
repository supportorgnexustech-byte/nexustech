import "@workspace/db";
import { NotificationModel } from "@workspace/db";
import { Redis } from "@upstash/redis";

async function main() {
  console.log("Starting notification-server...");
  
  // Wait a bit to ensure MongoDB connection is established (since it connects on import)
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("MongoDB initialization called.");

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn("[Notification Server] UPSTASH_REDIS_REST_URL or TOKEN not set. Waiting for configuration...");
    // Keep the process alive but do nothing — prevents crash in parallel mode
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  // Connect to Redis using Upstash REST
  const upstashRedis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  console.log(`Connected to Upstash Redis. Listening for contact notifications via polling...`);

  // Polling loop for processing queue since REST doesn't support BLPOP
  while (true) {
    try {
      const payload = await upstashRedis.lpop("contact:notifications");
      
      if (payload) {
        const data = typeof payload === "string" ? JSON.parse(payload) : payload as any;
        
        console.log(`[Notification Server] Received contact form from ${data.firstName} ${data.lastName}`);
        
        const notification = new NotificationModel({
          userId: "1", // Hardcoded admin user ID
          title: "New Contact Form Submission",
          message: `Name: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone}\nMessage: ${data.message}`,
          type: "message",
          isRead: false,
          createdAt: new Date(),
        });

        await notification.save();
        console.log(`[Notification Server] Successfully saved notification to MongoDB.`);
      } else {
        // No messages, wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error("[Notification Server] Error processing message:", err);
      // Wait a bit before retrying in case of network errors
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

main().catch(err => {
  console.error("Fatal error in notification-server:", err);
  process.exit(1);
});

