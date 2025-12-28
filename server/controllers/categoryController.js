import pool from '../config/db.js';

// Get all categories of logged in user
export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const [categories] = await pool.query(
      `SELECT id, name, type, icon 
       FROM categories 
       WHERE user_id = ? 
       ORDER BY type DESC, name ASC`,
      [userId]
    );

    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add custom category (user apni bana sake)
export const addCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, icon = 'category' } = req.body;

    if (!name || !type || !['expense', 'income'].includes(type)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (user_id, name, type, icon) 
       VALUES (?, ?, ?, ?)`,
      [userId, name.trim(), type, icon]
    );

    res.status(201).json({ 
      message: 'Category added',
      categoryId: result.insertId 
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};