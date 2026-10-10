import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/invoices/statement - Customer bill statement for custom period
router.get('/statement', async (req, res) => {
  try {
    const { customer_id, start_date, end_date } = req.query;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    // Fetch user business details
    const userRes = await query(
      'SELECT id, business_name, business_type, phone, address, currency FROM users WHERE id = $1',
      [req.user.id]
    );
    const business = userRes.rows[0];

    // Fetch customer details
    const custRes = await query(
      `SELECT c.*, s.name AS society_name, b.name AS block_name
       FROM customers c
       LEFT JOIN societies s ON c.society_id = s.id
       LEFT JOIN blocks b ON c.block_id = b.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [customer_id, req.user.id]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    const customer = custRes.rows[0];

    // Compute previous balance before start_date (if start_date provided)
    let previousBalance = parseFloat(customer.opening_balance) || 0;
    if (start_date) {
      const priorEntries = await query(
        'SELECT COALESCE(SUM(total_amount), 0) AS total FROM daily_entries WHERE customer_id = $1 AND entry_date < $2',
        [customer_id, start_date]
      );
      const priorPayments = await query(
        'SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE customer_id = $1 AND payment_date < $2',
        [customer_id, start_date]
      );
      previousBalance += (parseFloat(priorEntries.rows[0].total) - parseFloat(priorPayments.rows[0].total));
    }

    // Fetch entries within period
    let entrySql = `
      SELECT de.*,
             (
               SELECT json_agg(dei.*)
               FROM daily_entry_items dei
               WHERE dei.daily_entry_id = de.id
             ) AS items
      FROM daily_entries de
      WHERE de.customer_id = $1
    `;
    const entryParams = [customer_id];

    if (start_date) {
      entryParams.push(start_date);
      entrySql += ` AND de.entry_date >= $${entryParams.length}`;
    }
    if (end_date) {
      entryParams.push(end_date);
      entrySql += ` AND de.entry_date <= $${entryParams.length}`;
    }
    entrySql += ` ORDER BY de.entry_date ASC, de.id ASC`;

    const entriesRes = await query(entrySql, entryParams);

    // Fetch payments within period
    let paySql = `SELECT * FROM payments WHERE customer_id = $1`;
    const payParams = [customer_id];
    if (start_date) {
      payParams.push(start_date);
      paySql += ` AND payment_date >= $${payParams.length}`;
    }
    if (end_date) {
      payParams.push(end_date);
      paySql += ` AND payment_date <= $${payParams.length}`;
    }
    paySql += ` ORDER BY payment_date ASC, id ASC`;

    const paymentsRes = await query(paySql, payParams);

    const periodBilled = entriesRes.rows.reduce((sum, e) => sum + (parseFloat(e.total_amount) || 0), 0);
    const periodPaid = paymentsRes.rows.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const netPayable = previousBalance + periodBilled - periodPaid;

    return res.json({
      success: true,
      statement: {
        business,
        customer,
        date_generated: new Date().toISOString(),
        start_date: start_date || 'Beginning',
        end_date: end_date || new Date().toISOString().split('T')[0],
        previous_balance: previousBalance,
        period_billed: periodBilled,
        period_paid: periodPaid,
        net_payable: netPayable,
        entries: entriesRes.rows,
        payments: paymentsRes.rows,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/invoices/payments - Record customer payment
router.post('/payments', async (req, res) => {
  try {
    const { customer_id, amount, payment_date, payment_mode = 'cash', notes = '' } = req.body;

    if (!customer_id || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid customer ID and positive payment amount are required.' });
    }

    const dateVal = payment_date || new Date().toISOString().split('T')[0];

    // Check customer exists
    const custCheck = await query('SELECT id FROM customers WHERE id = $1 AND user_id = $2', [customer_id, req.user.id]);
    if (custCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const payRes = await query(
      `INSERT INTO payments (user_id, customer_id, amount, payment_date, payment_mode, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, customer_id, parseFloat(amount), dateVal, payment_mode, notes.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      payment: payRes.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/invoices/payments - List customer payments
router.get('/payments', async (req, res) => {
  try {
    const { customer_id } = req.query;
    let sql = `
      SELECT p.*, c.name AS customer_name, c.unit_number, s.name AS society_name
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN societies s ON c.society_id = s.id
      WHERE p.user_id = $1
    `;
    const params = [req.user.id];

    if (customer_id) {
      params.push(customer_id);
      sql += ` AND p.customer_id = $${params.length}`;
    }

    sql += ` ORDER BY p.payment_date DESC, p.id DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, payments: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
