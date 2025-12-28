import pool from "../config/db.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const budgetMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`; // e.g., '2025-12'

    // Total income this month
    const [[incomeTotal]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as totalIncome 
       FROM income 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, budgetMonth]
    );

    // Total expenses this month
    const [[expenseTotal]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as totalExpenses 
       FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, budgetMonth]
    );

    // Budget vs Spending per category
    const [budgetData] = await pool.query(
      `SELECT 
         c.id as category_id,
         c.name,
         c.icon,
         COALESCE(b.monthly_budget, 0) as budget,
         COALESCE(SUM(e.amount), 0) as spent
       FROM categories c
       LEFT JOIN budgets b ON c.id = b.category_id AND b.budget_month = ? AND b.user_id = ?
       LEFT JOIN expenses e ON c.id = e.category_id 
         AND e.user_id = ? 
         AND DATE_FORMAT(e.date, '%Y-%m') = ?
       WHERE c.user_id = ? AND c.type = 'expense'
       GROUP BY c.id, c.name, c.icon, b.monthly_budget
       ORDER BY spent DESC`,
      [budgetMonth, userId, userId, budgetMonth, userId]
    );

    const categories = budgetData.map((cat) => ({
      category_id: cat.category_id,
      name: cat.name,
      icon: cat.icon,
      budget: parseFloat(cat.budget),
      spent: parseFloat(cat.spent),
      progress: cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0,
      remaining: parseFloat(cat.budget) - parseFloat(cat.spent),
    }));

    res.json({
      summary: {
        totalIncome: parseFloat(incomeTotal.totalIncome || 0),
        totalExpenses: parseFloat(expenseTotal.totalExpenses || 0),
        savings:
          parseFloat(incomeTotal.totalIncome || 0) -
          parseFloat(expenseTotal.totalExpenses || 0),
      },
      categories,
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
