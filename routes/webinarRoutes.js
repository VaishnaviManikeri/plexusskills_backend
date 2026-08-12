import express from 'express';
import { registerForWebinar } from '../controllers/webinarController.js';
const router = express.Router();
router.post('/', registerForWebinar);
export default router;
