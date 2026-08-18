import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pg from "pg";

dotenv.config({ path: ".env.development" });

// Usage: npx tsx scripts/create-contributor.ts "Full Name" email@example.com "password" "Department"
const [, , name, email, password, department] = process.argv;
if (!name || !email || !password || password.length < 8) {
  console.error('Usage: npx tsx scripts/create-contributor.ts "Full Name" email@example.com "password" "Department"');
  process.exit(1);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  await client.query("begin");

  const hash = await bcrypt.hash(password, 12);

  // Create the app_users record with government_officer role
  const user = await client.query(
    `insert into app_users (full_name, email, password_hash, role)
     values ($1, $2, $3, 'government_officer')
     on conflict (email) do update
       set full_name = excluded.full_name,
           password_hash = excluded.password_hash,
           role = 'government_officer',
           is_active = true,
           updated_at = now()
     returning user_id`,
    [name.trim(), email.trim().toLowerCase(), hash],
  );

  const createdUser = user.rows[0];
  if (!createdUser) throw new Error("Account creation returned no user.");

  // Create the government_officers profile
  await client.query(
    `insert into government_officers (user_id, department)
     values ($1, $2)
     on conflict (user_id) do update set department = coalesce(excluded.department, government_officers.department)`,
    [createdUser.user_id, department ?? "General Contributor"],
  );

  await client.query("commit");
  console.log(`Contributor account created for ${email.trim().toLowerCase()}`);
  console.log(`  Name:       ${name.trim()}`);
  console.log(`  Department: ${department ?? "General Contributor"}`);
  console.log(`  Role:       government_officer`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
