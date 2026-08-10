import { Router } from 'express';
import { getIncidentMapData } from '../controllers/mapController.js';

const mapRoutes = Router();

mapRoutes.get('/', getIncidentMapData);

export default mapRoutes;
