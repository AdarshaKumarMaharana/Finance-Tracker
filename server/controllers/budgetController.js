import pool from "../config/db.js";

export const setBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, monthly_budget, budget_month } = req.body;

    if (!category_id || !monthly_budget || !budget_month) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [cat] = await pool.query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ? AND type = "expense"',
      [category_id, userId]
    );

    if (cat.length === 0) {
      return res.status(400).json({ message: "Invalid category" });
    }

    await pool.query(
      `INSERT INTO budgets (user_id, category_id, monthly_budget, budget_month)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE monthly_budget = VALUES(monthly_budget)`,
      [userId, category_id, monthly_budget, budget_month]
    );

    res.json({ message: "Budget saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { budget_month = "2025-12" } = req.query;

    const [budgets] = await pool.query(
      `SELECT b.category_id, c.name, c.icon, b.monthly_budget, b.budget_month
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.budget_month = ? AND c.type = 'expense'`,
      [userId, budget_month]
    );

    res.json({ budgets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
