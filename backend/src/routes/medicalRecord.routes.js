import express from 'express';
import multer from 'multer';
import medicalRecordController from '../controllers/medicalRecord.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ✅ FIX: Render pe /app folder read-only hota hai — diskStorage kaam nahi karta
// memoryStorage use karo — file RAM mein buffer ke roop mein rehti hai
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
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
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

router.use(authMiddleware);

router.post(
  '/upload',
  (req, res, next) => upload.single('file')(req, res, (err) => handleMulterError(err, req, res, next)),
  medicalRecordController.uploadRecord
);

router.get('/', medicalRecordController.getRecords);

export default router;