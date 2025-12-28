import pool from "../config/db.js";

// Add new expense
export const addExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      amount,
      date,
      category_id,
      description = "",
      icon = "receipt",
    } = req.body;

    if (!name || !amount || !date || !category_id) {
      return res
        .status(400)
        .json({ message: "Name, amount, date and category are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO expenses 
       (user_id, name, icon, amount, date, description, category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, icon, amount, date, description, category_id]
    );

    res.status(201).json({
      message: "Expense added successfully",
      expenseId: result.insertId,
    });
  } catch (err) {
    console.error("Add Expense Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all expenses
export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    const [expenses] = await pool.query(
      `SELECT 
          id, name, icon, amount, date, description, category_id, 
          created_at, updated_at 
       FROM expenses 
       WHERE user_id = ? 
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );

    res.json({ expenses });
  } catch (err) {
    console.error("Get Expenses Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      amount,
      date,
      category_id,
      description = "",
      icon = "receipt",
    } = req.body;

    const [result] = await pool.query(
      `UPDATE expenses 
       SET name = ?, icon = ?, amount = ?, date = ?, description = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, icon, amount, date, description, category_id, id, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Expense not found or not owned by you" });
    }

    res.json({ message: "Expense updated successfully" });
  } catch (err) {
    console.error("Update Expense Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Expense not found or not owned by you" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Delete Expense Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
