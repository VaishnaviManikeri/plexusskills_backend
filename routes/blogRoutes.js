import express from 'express';
import {
  createBlog,
  getBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} from '../controllers/blogController.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', auth, upload.single('image'), createBlog);
router.put('/:id', auth, upload.single('image'), updateBlog);
router.delete('/:id', auth, deleteBlog);

export default router;