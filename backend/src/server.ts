import express from 'express';
import { pool } from './models/database.js';
import moderationRoutes from './routes/moderationRoutes.js';

const app = express();
app.use(express.json());

// TODO: attach your auth middleware that sets req.user here (JWT/session)
// app.use(authMiddleware);

app.use('/api/moderation', moderationRoutes);

const port = process.env.PORT || 4000;
// Supabase/Postgres connection check before listening.
pool.query('select 1')
  .then(() => {
    console.log('database connected');
    app.listen(port, () => console.log('listening on', port));
  })
  .catch(err => {
    console.error('database connect error', err);
  });
