import { Router } from 'express';
import { signup } from '../controllers/signupController';

const router = Router();

router.post('/signup', signup);

export default router;