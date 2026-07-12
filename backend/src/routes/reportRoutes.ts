import express from 'express';
import { submitReportController } from '../controllers/reportController.ts';

const router = express.Router();

router.post('/submit', submitReportController);

export default router;