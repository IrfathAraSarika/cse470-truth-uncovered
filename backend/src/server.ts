import express from 'express';
import mongoose from 'mongoose';
import moderationRoutes from './routes/moderationRoutes';

const app = express();
app.use(express.json());

// TODO: attach your auth middleware that sets req.user here (JWT/session)
// app.use(authMiddleware);

app.use('/api/moderation', moderationRoutes);

const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017/moderation';
mongoose.connect(MONGO).then(() => {
  console.log('mongo connected');
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log('listening on', port));
}).catch(err => {
  console.error('mongo connect error', err);
});
