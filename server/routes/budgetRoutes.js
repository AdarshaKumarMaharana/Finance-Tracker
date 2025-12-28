import express from 'express';
import { setBudget, getBudgets } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, setBudget);
router.get('/', protect, getBudgets);

export default router;