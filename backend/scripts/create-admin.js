import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
const [, , name, email, password, employeeId] = process.argv;
if (!name || !email || !password || password.length < 8) {
    console.error('Usage: npm run admin:create -- "Full Name" email@example.com "password" [employee-id]');
    process.exit(1);
}
if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
    await client.connect();
    await client.query("begin");
    const hash = await bcrypt.hash(password, 12);
    const user = await client.query("insert into app_users (full_name, email, password_hash, role) values ($1, $2, $3, 'admin') returning user_id", [name.trim(), email.trim().toLowerCase(), hash]);
    await client.query("insert into admins (user_id, employee_id) values ($1, $2)", [user.rows[0].user_id, employeeId ?? null]);
    await client.query("commit");
    console.log(`Admin account created for ${email.trim().toLowerCase()}.`);
}
catch (error) {
    await client.query("rollback");
    throw error;
}
finally {
    await client.end();
}
//# sourceMappingURL=create-admin.js.map