import express from 'express';
import {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} from '../controllers/noticeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getNotices);
router.get('/:id', getNoticeById);
router.post('/', auth, createNotice);
router.put('/:id', auth, updateNotice);
router.delete('/:id', auth, deleteNotice);

export default router;