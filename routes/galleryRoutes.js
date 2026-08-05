import express from 'express';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
} from '../controllers/galleryController.js';
const router = express.Router();

// Public routes — used by the public Gallery page
router.get('/', getAllGallery);
router.get('/:id', getGalleryById);

// Admin-only routes — used by GalleryAdmin page
router.post('/', auth, upload.single('file'), createGallery);
router.put('/:id', auth, upload.single('file'), updateGallery);
router.delete('/:id', auth, deleteGallery);

export default router;