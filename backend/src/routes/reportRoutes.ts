import express from 'express';
import { submitReportController } from '../controller/reportController.js';

const router = express.Router();

router.post('/submit', submitReportController);

export default router;