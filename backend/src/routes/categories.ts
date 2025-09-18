import express from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkCreateCategories
} from '../controllers/categories';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin routes
router.post('/', authenticateToken, requireRole(['admin']), createCategory);
router.put('/:id', authenticateToken, requireRole(['admin']), updateCategory);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteCategory);
router.post('/bulk', authenticateToken, requireRole(['admin']), bulkCreateCategories);

export default router;