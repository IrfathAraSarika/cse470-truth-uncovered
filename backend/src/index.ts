import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRoutes from './routes/reportRoutes.js';

// Load the development environment variables
dotenv.config({ path: '.env.development' });

const app = express();
app.use(cors());
app.use(express.json());

// 2. This links the frontend /api/reports URL to your routes file
app.use('/api/reports', reportRoutes); 

const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!', db: process.env.DATABASE_URL ? 'Connected' : 'Not Connected' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});