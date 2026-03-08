import { z } from 'zod';
import logger from '../utils/logger.js';

// Validation middleware factory
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Validation error:', errors);
        return res.status(400).json({
          detail: 'Validation error',
          errors,
        });
      }
      next(error);
    }
  };
};

export default validate;
