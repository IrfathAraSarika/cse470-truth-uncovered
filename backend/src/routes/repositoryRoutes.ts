import { Router } from 'express';
import { fetchPublicReports } from '../controllers/repositoryController.js';

const repositoryRoutes = Router();

repositoryRoutes.get('/', fetchPublicReports);

export default repositoryRoutes;
