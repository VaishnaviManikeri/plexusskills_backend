import express from 'express';
import { submitEnrollment } from '../controllers/enrollmentController.js';
const router = express.Router();
router.post('/', submitEnrollment);
export default router;
