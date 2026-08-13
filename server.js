import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import webinarRoutes from './routes/webinarRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load this backend's environment file, even when started from the
// repository root (for example: `node backend/server.js`).
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5033;
const HOST = process.env.HOST || '0.0.0.0';

// CORS Configuration. Additional deployed frontend URLs can be supplied as a
// comma-separated CORS_ORIGINS environment variable on Render.
const defaultOrigins = 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,https://plexusskills.netlify.app,https://plexusskills.in,https://www.plexusskills.in';
const allowedOrigins = `${defaultOrigins},${process.env.CORS_ORIGINS || ''}`
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/webinar-registrations', webinarRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/submissions', submissionRoutes);

// Public status routes for VPS/load-balancer checks. These intentionally expose
// no credentials or environment-variable values.
const serverStatus = () => ({
  status: 'OK',
  message: 'Plexus Skills backend is running',
  environment: process.env.NODE_ENV || 'development',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

app.get('/', (req, res) => res.status(200).json(serverStatus()));
app.get('/api/health', (req, res) => res.status(200).json(serverStatus()));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Résumé must be 5 MB or smaller.' });
  }
  if (err.name === 'MulterError' || err.message?.includes('PDF, DOC, or DOCX')) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Please check your MongoDB connection string');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Handle mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📍 Local health: http://localhost:${PORT}/api/health`);
  if (process.env.PUBLIC_BACKEND_URL) {
    console.log(`🌐 Public health: ${process.env.PUBLIC_BACKEND_URL.replace(/\/$/, '')}/api/health`);
  }
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
