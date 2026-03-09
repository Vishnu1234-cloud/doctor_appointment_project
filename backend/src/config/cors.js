import config from './env.js';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin only in development (Postman, etc)
    if (!origin) {
      if (config.nodeEnv === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: Origin is required in production'));
    }

    // In development, allow wildcard origins
    if (config.nodeEnv === 'development' && config.corsOrigins.includes('*')) {
      return callback(null, true);
    }

    // Explicitly check whitelist
    if (config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

export default corsOptions;
