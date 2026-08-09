import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development' });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
export const config = { databaseUrl: process.env.DATABASE_URL, jwtSecret: process.env.JWT_SECRET, frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173', port: Number(process.env.PORT ?? 5000), isProduction: process.env.NODE_ENV === 'production' };
