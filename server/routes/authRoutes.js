import express from 'express';
const router = express.Router();
import { loginUser } from '../controllers/authController.js';

router.post('/login', loginUser);

export default router;
