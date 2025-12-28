import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import express from 'express';
import cors from 'cors';
import pool from './config/db.js';
import baseRoutes from './baseRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

console.log("DB USER:", process.env.DB_USER);

// DB connection test
try {
  const connection = await pool.getConnection();
  console.log('MySQL Database connected successfully!');
  connection.release();
} catch (err) {
  console.error('Database connection failed:', err.message);
}

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Backend connected successfully!' });
});

// All API routes
app.use('/api', baseRoutes);   // <-- Yahan sab routes aa jayeng

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});