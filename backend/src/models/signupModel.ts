import bcrypt from 'bcryptjs';
import { pool } from './database.js';

export async function createAccount(name: string, email: string, password: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await client.query<{ user_id: string }>(`insert into app_users (full_name, email, password_hash, role) values ($1, $2, $3, 'citizen') returning user_id`, [name, email, passwordHash]);
    const createdUser = user.rows[0];
    if (!createdUser) throw new Error('Account creation returned no user.');
    await client.query(
      `insert into citizens (user_id, email, "fullName", "passwordHash", "isVerified")
       values ($1, $2, $3, $4, false)`,
      [createdUser.user_id, email, name, passwordHash],
    );
    await client.query('commit');
    return createdUser.user_id;
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}
