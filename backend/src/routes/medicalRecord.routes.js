import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import medicalRecordController from '../controllers/medicalRecord.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── Multer Setup ────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/medical-records');

// Upload folder create karo agar exist nahi karta
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${req.user.id}_${Date.now()}_${sanitized}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ detail: 'File too large. Max 10MB allowed.' });
    }
    return res.status(400).json({ detail: `Upload error: ${err.message}` });
  }
  if (err) return res.status(400).json({ detail: err.message });
  next();
};

// ── Routes ──────────────────────────────────────────────────
router.use(authMiddleware);

// ✅ FIX: Multer middleware properly add kiya
router.post(
  '/upload',
  (req, res, next) => upload.single('file')(req, res, (err) => handleMulterError(err, req, res, next)),
  medicalRecordController.uploadRecord
);

router.get('/', medicalRecordController.getRecords);

export default router;
