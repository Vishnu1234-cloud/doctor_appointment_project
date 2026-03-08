import express from 'express';
import blogController from '../controllers/blog.controller.js';

const router = express.Router();

// Public routes
router.get('/', blogController.getPosts);
router.get('/:slug', blogController.getPostBySlug);

export default router;
