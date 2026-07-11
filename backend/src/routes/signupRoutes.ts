import { Router } from 'express';
import { signup } from '../controllers/signupController.js';
const signupRoutes = Router();
signupRoutes.post('/', signup);
export default signupRoutes;
