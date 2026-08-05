import express from 'express';
import {
  createCareer,
  getCareers,
  getAllCareers,
  getCareerById,
  updateCareer,
  deleteCareer,
} from '../controllers/careerController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCareers);
router.get('/all', auth, getAllCareers);
router.get('/:id', getCareerById);
router.post('/', auth, createCareer);
router.put('/:id', auth, updateCareer);
router.delete('/:id', auth, deleteCareer);

export default router;