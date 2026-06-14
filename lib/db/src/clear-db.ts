import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexus";

async function clearDatabase() {
  try {
    console.log("Connecting to MongoDB at", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully. Dropping database...");
    
    await mongoose.connection.db?.dropDatabase();
    console.log("✅ Database dropped successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();
