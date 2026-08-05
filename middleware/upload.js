import multer from 'multer';

// Store the file in memory as a buffer, then we stream it straight to Cloudinary.
// This avoids writing temp files to disk and lets us support images of any type
// and videos of any size (up to the generous limit below).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image or video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB safety ceiling — effectively "any size" video/image
  },
});

export default upload;