import express from 'express';
import multer from 'multer';
import { submitAdvisor, submitContact, submitJobApplication, submitPartnership } from '../controllers/submissionController.js';

const router = express.Router();
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only PDF, DOC, or DOCX résumés are allowed.'), allowed.includes(file.mimetype));
  },
});

router.post('/contact', submitContact);
router.post('/advisor', submitAdvisor);
router.post('/partnership', submitPartnership);
router.post('/career', resumeUpload.single('resume'), submitJobApplication);

export default router;
