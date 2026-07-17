import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.development" });

const { Client } = pg;

const requiredTables = [
  "app_users",
  "citizens",
  "admins",
  "government_officers",
  "ngo_partners",
  "locations",
  "institutions",
  "reports",
  "evidence_files",
  "cases",
  "follow_up_reports",
  "duplicate_detections",
  "flagged_contents",
  "badges",
  "citizen_badges",
  "gamification_records",
  "trust_scores",
  "fame_shame_records",
  "impact_stories",
  "analytics_dashboards",
  "heatmap_data",
  "blog_posts",
  "legal_resources",
  "notifications"
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env.development and add your Supabase PostgreSQL URI.");
  process.exit(1);
}

if (process.env.DATABASE_URL.includes("PASTE_DATABASE_PASSWORD_HERE")) {
  console.error("DATABASE_URL still contains PASTE_DATABASE_PASSWORD_HERE.");
  console.error("Get the database password or connection URI from Supabase Project Settings -> Database.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();

  const timeResult = await client.query("select now() as server_time, current_database() as database_name");
  console.log("Connected to PostgreSQL.");
  console.log(`Database: ${timeResult.rows[0].database_name}`);
  console.log(`Server time: ${timeResult.rows[0].server_time.toISOString()}`);

  const tableResult = await client.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type in ('BASE TABLE', 'VIEW')
      order by table_name
    `
  );

  const existingTables = new Set(tableResult.rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((tableName) => !existingTables.has(tableName));

  console.log(`Found ${existingTables.size} public tables/views.`);

  if (missingTables.length > 0) {
    console.error("Missing expected tables:");
    for (const tableName of missingTables) {
      console.error(`- ${tableName}`);
    }
    console.error("Run supabase/migrations/0001_initial_schema.sql in the Supabase SQL Editor, then run this check again.");
    process.exit(1);
  }

  await client.query("select count(*)::int as count from app_users");
  await client.query("select count(*)::int as count from reports");
  await client.query("select count(*)::int as count from cases");

  console.log("Required schema is present and basic queries work.");
} catch (error) {
  console.error("Database check failed.");
  console.error(error.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
