import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = today.substring(0, 7) + '-01';

    // 1. Today's stats
    const todayRes = await query(
      `SELECT COALESCE(SUM(total_amount), 0) AS today_revenue,
              COALESCE(SUM(total_items), 0) AS today_items,
              COUNT(id) AS today_entries_count
       FROM daily_entries
       WHERE user_id = $1 AND entry_date = $2`,
      [req.user.id, today]
    );

    // 2. Month-to-date stats
    const monthRes = await query(
      `SELECT COALESCE(SUM(total_amount), 0) AS month_revenue,
              COALESCE(SUM(total_items), 0) AS month_items,
              COUNT(id) AS month_entries_count
       FROM daily_entries
       WHERE user_id = $1 AND entry_date >= $2 AND entry_date <= $3`,
      [req.user.id, firstDayOfMonth, today]
    );

    // 3. Outstanding balance calculation across all customers
    const duesRes = await query(
      `SELECT 
         COALESCE(SUM(c.opening_balance), 0) +
         COALESCE((SELECT SUM(de.total_amount) FROM daily_entries de WHERE de.user_id = $1), 0) -
         COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.user_id = $1), 0) AS total_market_dues
       FROM customers c
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    // 4. Counts
    const countsRes = await query(
      `SELECT 
        (SELECT COUNT(*) FROM customers WHERE user_id = $1) AS total_customers,
        (SELECT COUNT(*) FROM societies WHERE user_id = $1) AS total_societies,
        (SELECT COUNT(*) FROM services WHERE user_id = $1 AND is_active = TRUE) AS total_services`,
      [req.user.id]
    );

    // 5. Recent 8 entries with customer and society info
    const recentRes = await query(
      `SELECT de.*, c.name AS customer_name, c.unit_number, s.name AS society_name, b.name AS block_name
       FROM daily_entries de
       JOIN customers c ON de.customer_id = c.id
       LEFT JOIN societies s ON c.society_id = s.id
       LEFT JOIN blocks b ON c.block_id = b.id
       WHERE de.user_id = $1
       ORDER BY de.created_at DESC
       LIMIT 8`,
      [req.user.id]
    );

    // 6. Last 7 days daily revenue for charts
    const chartRes = await query(
      `SELECT entry_date, 
              SUM(total_amount) AS revenue, 
              SUM(total_items) AS items,
              COUNT(id) AS entries_count
       FROM daily_entries
       WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY entry_date
       ORDER BY entry_date ASC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      stats: {
        today: {
          revenue: parseFloat(todayRes.rows[0].today_revenue) || 0,
          items: parseFloat(todayRes.rows[0].today_items) || 0,
          entries: parseInt(todayRes.rows[0].today_entries_count) || 0,
        },
        month: {
          revenue: parseFloat(monthRes.rows[0].month_revenue) || 0,
          items: parseFloat(monthRes.rows[0].month_items) || 0,
          entries: parseInt(monthRes.rows[0].month_entries_count) || 0,
        },
        financials: {
          total_market_dues: parseFloat(duesRes.rows[0].total_market_dues) || 0,
          total_customers: parseInt(countsRes.rows[0].total_customers) || 0,
          total_societies: parseInt(countsRes.rows[0].total_societies) || 0,
          total_services: parseInt(countsRes.rows[0].total_services) || 0,
        },
        recent_entries: recentRes.rows,
        daily_trends: chartRes.rows,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
