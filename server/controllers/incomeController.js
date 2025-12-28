import pool from "../config/db.js";

/* ============================
   ADD NEW INCOME
============================ */
export const addIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      amount,
      date,
      category_id,
      description = "",
      icon = "account_balance_wallet",
    } = req.body;

    // Validation
    if (!name || !amount || !date || !category_id) {
      return res.status(400).json({
        message: "Name, amount, date and category are required",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO income 
       (user_id, name, icon, amount, date, description, category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, icon, amount, date, description, category_id]
    );

    res.status(201).json({
      message: "Income added successfully",
      incomeId: result.insertId,
    });
  } catch (err) {
    console.error("Add Income Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   GET ALL INCOME
============================ */
export const getIncome = async (req, res) => {
  try {
    const userId = req.user.id;

    const [incomes] = await pool.query(
      `SELECT 
          id,
          name,
          icon,
          amount,
          date,
          description,
          category_id,
          created_at,
          updated_at
       FROM income 
       WHERE user_id = ? 
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );

    res.json({ incomes });
  } catch (err) {
    console.error("Get Income Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   UPDATE INCOME
============================ */
export const updateIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      amount,
      date,
      category_id,
      description = "",
      icon = "account_balance_wallet",
    } = req.body;

    // Basic validation
    if (!name || !amount || !date || !category_id) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const [result] = await pool.query(
      `UPDATE income 
       SET 
         name = ?, 
         icon = ?, 
         amount = ?, 
         date = ?, 
         description = ?, 
         category_id = ?, 
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, icon, amount, date, description, category_id, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Income not found or not owned by you",
      });
    }

    res.json({ message: "Income updated successfully" });
  } catch (err) {
    console.error("Update Income Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   DELETE INCOME
============================ */
export const deleteIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM income WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Income not found or not owned by you",
      });
    }

    res.json({ message: "Income deleted successfully" });
  } catch (err) {
    console.error("Delete Income Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
