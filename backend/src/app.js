import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
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
import passport from './config/passport.js';
import reviewRoutes from './routes/review.route.js';
import zoomRoutes from './routes/zoom.routes.js';

const app = express();
// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// Security middleware
app.use(helmet());
// CORS
app.use(cors(corsOptions));
app.use(passport.initialize());
// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Sanitize data
app.use(mongoSanitize());
app.use(xss());
// Request IDs for Tracing
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});
// HTTP logging globally with request correlation
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      client_ip: req.remoteAddress,
      user_agent: req.headers['user-agent']
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
}));
// Rate limiting
app.use('/api', apiLimiter);
// API Router configuration for versioning
const apiRouter = express.Router();
// Mount Health Check natively onto api
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), reqId: req.id });
});
// API routes explicitly loaded into the sub-router
apiRouter.use('/auth', authRoutes);
apiRouter.use('/doctor', doctorRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/prescriptions', prescriptionRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/testimonials', testimonialRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/blog', blogRoutes);
apiRouter.use('/medical-records', medicalRecordRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/zoom', zoomRoutes);

// Root route
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'HealthLine Telemedicine API',
    v1: '/api/v1',
    status: 'active',
  });
});
// Alias mounting strategies internally
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter); // Legacy backwards-compatibility
// 404 handler
app.use(notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler);
export default app;