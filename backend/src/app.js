import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import config from './config/env.js';
import corsOptions from './config/cors.js';
import logger from './utils/logger.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import chatRoutes from './routes/chat.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import blogRoutes from './routes/blog.routes.js';
import medicalRecordRoutes from './routes/medicalRecord.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data
app.use(mongoSanitize());

// HTTP logging
if (config.nodeEnv === 'development') {
  app.use(pinoHttp({ logger }));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes (all prefixed with /api)
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/api', (req, res) => {
  res.json({
    message: 'HealthLine Telemedicine API',
    version: '2.0.0',
    status: 'active',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
