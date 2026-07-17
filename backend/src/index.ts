import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { pool } from './models/database.js';
import loginRoutes from './routes/loginRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import signupRoutes from './routes/signupRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';

const app = express();
app.use(cors({ origin: config.frontendOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.use('/api/login', loginRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/verification', verificationRoutes);

app.get('/api/health', async (_request, response, next) => {
  try {
    const result = await pool.query('select now() as database_time');
    response.json({ status: 'ok', database: 'connected', databaseTime: result.rows[0].database_time });
  } catch (error) { next(error); }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error.' });
});

app.listen(config.port, () => console.log(`Backend running on http://localhost:${config.port}`));
