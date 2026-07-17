import { Router } from 'express';
import {
  getMyVerification,
  submitMyVerification,
} from '../controllers/verificationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const verificationRoutes = Router();
verificationRoutes.use(requireAuth);
verificationRoutes.get('/me', getMyVerification);
verificationRoutes.post('/me', submitMyVerification);

export default verificationRoutes;
