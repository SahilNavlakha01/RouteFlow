import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/customers - List customers with live calculated balance
router.get('/', async (req, res) => {
  try {
    const { society_id, block_id, search } = req.query;

    let sql = `
      SELECT c.*,
             s.name AS society_name,
             b.name AS block_name,
             COALESCE((SELECT SUM(de.total_amount) FROM daily_entries de WHERE de.customer_id = c.id), 0) AS total_billed,
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) AS total_paid
      FROM customers c
      LEFT JOIN societies s ON c.society_id = s.id
      LEFT JOIN blocks b ON c.block_id = b.id
      WHERE c.user_id = $1
    `;
    const params = [req.user.id];

    if (society_id) {
      params.push(society_id);
      sql += ` AND c.society_id = $${params.length}`;
    }

    if (block_id) {
      params.push(block_id);
      sql += ` AND c.block_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(c.name) LIKE $${params.length} OR LOWER(c.unit_number) LIKE $${params.length} OR LOWER(c.phone) LIKE $${params.length})`;
    }

    sql += ` ORDER BY s.name ASC, b.name ASC, c.unit_number ASC`;

    const result = await query(sql, params);

    // Compute net current due balance for each customer
    const customers = result.rows.map(cust => {
      const opening = parseFloat(cust.opening_balance) || 0;
      const billed = parseFloat(cust.total_billed) || 0;
      const paid = parseFloat(cust.total_paid) || 0;
      const current_balance = opening + billed - paid;

      return {
        ...cust,
        total_billed: billed,
        total_paid: paid,
        current_balance: current_balance,
      };
    });

    return res.json({ success: true, customers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/customers/:id - Single customer with entry history and payments ledger
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const custRes = await query(
      `SELECT c.*,
              s.name AS society_name,
              b.name AS block_name
       FROM customers c
       LEFT JOIN societies s ON c.society_id = s.id
       LEFT JOIN blocks b ON c.block_id = b.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const customer = custRes.rows[0];

    // Fetch entries
    const entriesRes = await query(
      `SELECT de.*,
              (SELECT json_agg(dei.*) FROM daily_entry_items dei WHERE dei.daily_entry_id = de.id) AS items
       FROM daily_entries de
       WHERE de.customer_id = $1
       ORDER BY de.entry_date DESC, de.id DESC`,
      [id]
    );

    // Fetch payments
    const paymentsRes = await query(
      `SELECT * FROM payments WHERE customer_id = $1 ORDER BY payment_date DESC, id DESC`,
      [id]
    );

    const total_billed = entriesRes.rows.reduce((sum, e) => sum + (parseFloat(e.total_amount) || 0), 0);
    const total_paid = paymentsRes.rows.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const opening = parseFloat(customer.opening_balance) || 0;
    const current_balance = opening + total_billed - total_paid;

    return res.json({
      success: true,
      customer: {
        ...customer,
        total_billed,
        total_paid,
        current_balance,
        entries: entriesRes.rows,
        payments: paymentsRes.rows,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone = '', society_id = null, block_id = null, unit_number, opening_balance = 0, notes = '' } = req.body;

    if (!name || !unit_number) {
      return res.status(400).json({ success: false, message: 'Customer name and flat / unit number are required.' });
    }

    const result = await query(
      `INSERT INTO customers (user_id, society_id, block_id, unit_number, name, phone, opening_balance, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, society_id || null, block_id || null, unit_number.trim(), name.trim(), phone.trim(), parseFloat(opening_balance) || 0, notes.trim()]
    );

    return res.status(201).json({ success: true, customer: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, society_id, block_id, unit_number, opening_balance, notes } = req.body;

    const result = await query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           society_id = COALESCE($3, society_id),
           block_id = COALESCE($4, block_id),
           unit_number = COALESCE($5, unit_number),
           opening_balance = COALESCE($6, opening_balance),
           notes = COALESCE($7, notes)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        name ? name.trim() : null,
        phone !== undefined ? phone.trim() : null,
        society_id !== undefined ? (society_id || null) : null,
        block_id !== undefined ? (block_id || null) : null,
        unit_number ? unit_number.trim() : null,
        opening_balance !== undefined ? parseFloat(opening_balance) : null,
        notes !== undefined ? notes.trim() : null,
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
