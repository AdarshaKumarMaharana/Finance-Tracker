import express from 'express';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import userRoutes from './routes/userRoutes.js';
// Baad mein yahan aur routes add karenge jaise expenseRoutes, etc.

const baseRoutes = express.Router();

// Sab routes yahan mount karenge
baseRoutes.use('/auth', authRoutes);
// Example for future:
baseRoutes.use('/expenses', expenseRoutes);
baseRoutes.use('/income', incomeRoutes);
baseRoutes.use('/categories', categoryRoutes);
baseRoutes.use('/budgets', budgetRoutes);
baseRoutes.use('/transactions', transactionRoutes);
baseRoutes.use('/', userRoutes);


export default baseRoutes;