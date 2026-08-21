import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";

dotenv.config({ path: ".env.development" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database. Reading migration script...");

    const sqlPath = path.resolve("../supabase/migrations/0006_awareness_articles.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("Executing migration SQL...");
    await client.query(sql);

    console.log("Migration executed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
