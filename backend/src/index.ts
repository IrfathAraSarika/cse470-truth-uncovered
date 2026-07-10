import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load the development environment variables
dotenv.config({ path: '.env.development' });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!', db: process.env.DATABASE_URL ? 'Connected' : 'Not Connected' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});