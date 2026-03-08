import pino from 'pino';
import config from '../config/env.js';

const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  // CRITICAL: Never log OTP in production
  redact: config.nodeEnv === 'production' ? ['otp', 'password', 'token', 'secret'] : [],
});

export default logger;
