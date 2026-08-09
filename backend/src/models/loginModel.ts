import bcrypt from 'bcryptjs';
import { pool } from './database.js';

export async function authenticate(email: string, password: string) {
  const result = await pool.query(`select u.user_id, u.full_name, u.email, u.password_hash, u.role, u.is_active, c.citizen_id from app_users u left join citizens c on c.user_id = u.user_id where u.email = $1`, [email]);
  const user = result.rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) return null;
  return user;
}
