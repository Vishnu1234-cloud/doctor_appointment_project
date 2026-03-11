import config from './env.js';

const corsOptions = {
  origin: (origin, callback) => {

    // ✅ Allow requests with NO origin (Render health checks, server-to-server, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // ✅ Development mode — allow all if '*' present
    if (config.nodeEnv === 'development' && config.corsOrigins.includes('*')) {
      return callback(null, true);
    }

    // ✅ Production whitelist check
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ❌ Block others
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],

  exposedHeaders: ['Content-Range', 'X-Content-Range'],

  maxAge: 86400, // 24 hours
};

export default corsOptions;