import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Prioritize loading environment variables from .env.development
const envDevPath = path.resolve(process.cwd(), '.env.development');
if (fs.existsSync(envDevPath)) {
  dotenv.config({ path: envDevPath, override: true });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in .env.development');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET in .env.development must contain at least 32 characters.');

// Fallback 32-byte hex key (64 characters) if missing in environment
const fallbackVaultKey = crypto.randomBytes(32).toString('hex');

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  port: Number(process.env.PORT ?? 5000),
  isProduction: process.env.NODE_ENV === 'production',
  supabaseUrl: process.env.SUPABASE_URL ?? 'https://zpsciwuqwvnimktpedri.supabase.co',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  vaultEncryptionKey: process.env.VAULT_ENCRYPTION_KEY ?? process.env['VAULT_ENCRYPTION-KEY'] ?? fallbackVaultKey,
};

export const SUPABASE_URL = config.supabaseUrl;
export const SUPABASE_SERVICE_ROLE_KEY = config.supabaseServiceRoleKey;
export const VAULT_ENCRYPTION_KEY = config.vaultEncryptionKey;
