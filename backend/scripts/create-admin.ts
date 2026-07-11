import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pg from "pg";

dotenv.config({ path: ".env.development" });

const [, , name, email, password, employeeId] = process.argv;
if (!name || !email || !password || password.length < 8) {
  console.error('Usage: npm run admin:create -- "Full Name" email@example.com "password" [employee-id]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query("begin");
  const hash = await bcrypt.hash(password, 12);
  const user = await client.query<{ user_id: string }>(
    `insert into app_users (full_name, email, password_hash, role)
     values ($1, $2, $3, 'admin')
     on conflict (email) do update
       set full_name = excluded.full_name,
           password_hash = excluded.password_hash,
           role = 'admin',
           is_active = true,
           updated_at = now()
     returning user_id`,
    [name.trim(), email.trim().toLowerCase(), hash],
  );
  const createdUser = user.rows[0];
  if (!createdUser) throw new Error("Admin account creation returned no user.");
  await client.query(
    `insert into admins (user_id, employee_id)
     values ($1, $2)
     on conflict (user_id) do update set employee_id = coalesce(excluded.employee_id, admins.employee_id)`,
    [createdUser.user_id, employeeId ?? null],
  );
  await client.query("commit");
  console.log(`Admin account created for ${email.trim().toLowerCase()}.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
