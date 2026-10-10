import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/daily-entries
router.get('/', async (req, res) => {
  try {
    const { date, society_id, block_id, customer_id, status } = req.query;

    let sql = `
      SELECT de.*,
             c.name AS customer_name,
             c.phone AS customer_phone,
             c.unit_number,
             s.id AS society_id,
             s.name AS society_name,
             b.id AS block_id,
             b.name AS block_name,
             (
               SELECT json_agg(
                 json_build_object(
                   'id', dei.id,
                   'service_id', dei.service_id,
                   'service_name', dei.service_name,
                   'unit', dei.unit,
                   'unit_price', dei.unit_price,
                   'quantity', dei.quantity,
                   'total_price', dei.total_price
                 )
               )
               FROM daily_entry_items dei
               WHERE dei.daily_entry_id = de.id
             ) AS items
      FROM daily_entries de
      JOIN customers c ON de.customer_id = c.id
      LEFT JOIN societies s ON c.society_id = s.id
      LEFT JOIN blocks b ON c.block_id = b.id
      WHERE de.user_id = $1
    `;
    const params = [req.user.id];

    if (date) {
      params.push(date);
      sql += ` AND de.entry_date = $${params.length}`;
    }

    if (society_id) {
      params.push(society_id);
      sql += ` AND c.society_id = $${params.length}`;
    }

    if (block_id) {
      params.push(block_id);
      sql += ` AND c.block_id = $${params.length}`;
    }

    if (customer_id) {
      params.push(customer_id);
      sql += ` AND de.customer_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND de.status = $${params.length}`;
    }

    sql += ` ORDER BY de.entry_date DESC, de.id DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, entries: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/daily-entries - Create entry with items
router.post('/', async (req, res) => {
  try {
    const {
      customer_id,
      entry_date,
      items = [],
      status = 'collected',
      payment_status = 'unpaid',
      paid_amount = 0,
      notes = '',
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service item is required.' });
    }

    const dateVal = entry_date || new Date().toISOString().split('T')[0];

    // Verify customer belongs to user
    const custCheck = await query('SELECT id FROM customers WHERE id = $1 AND user_id = $2', [customer_id, req.user.id]);
    if (custCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Calculate totals
    let totalAmount = 0;
    let totalItemsCount = 0;

    const validatedItems = items.map((it) => {
      const qty = parseFloat(it.quantity) || 0;
      const unitPrice = parseFloat(it.unit_price) || 0;
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;
      totalItemsCount += qty;
      return {
        service_id: it.service_id || null,
        service_name: it.service_name || 'Custom Service',
        unit: it.unit || 'pcs',
        unit_price: unitPrice,
        quantity: qty,
        total_price: lineTotal,
      };
    });

    const parsedPaid = parseFloat(paid_amount) || 0;
    let effectivePaymentStatus = payment_status;
    if (parsedPaid >= totalAmount && totalAmount > 0) {
      effectivePaymentStatus = 'paid';
    } else if (parsedPaid > 0) {
      effectivePaymentStatus = 'partial';
    }

    // Check if an entry already exists for this customer on this date
    const existingEntryRes = await query(
      `SELECT id FROM daily_entries WHERE user_id = $1 AND customer_id = $2 AND entry_date = $3`,
      [req.user.id, customer_id, dateVal]
    );

    let newEntry;
    if (existingEntryRes.rows.length > 0) {
      const existingId = existingEntryRes.rows[0].id;
      const updateRes = await query(
        `UPDATE daily_entries
         SET total_amount = $1,
             total_items = $2,
             status = $3,
             payment_status = $4,
             paid_amount = $5,
             notes = $6
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [totalAmount, totalItemsCount, status, effectivePaymentStatus, parsedPaid, notes, existingId, req.user.id]
      );
      newEntry = updateRes.rows[0];

      // Clear previous items before re-inserting
      await query('DELETE FROM daily_entry_items WHERE daily_entry_id = $1', [existingId]);
    } else {
      // Insert new daily entry
      const entryRes = await query(
        `INSERT INTO daily_entries (user_id, customer_id, entry_date, total_amount, total_items, status, payment_status, paid_amount, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [req.user.id, customer_id, dateVal, totalAmount, totalItemsCount, status, effectivePaymentStatus, parsedPaid, notes]
      );
      newEntry = entryRes.rows[0];
    }

    // Insert items
    for (const item of validatedItems) {
      await query(
        `INSERT INTO daily_entry_items (daily_entry_id, service_id, service_name, unit, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newEntry.id, item.service_id, item.service_name, item.unit, item.unit_price, item.quantity, item.total_price]
      );
    }

    // If paid amount was recorded immediately, log payment transaction
    if (parsedPaid > 0) {
      await query(
        `INSERT INTO payments (user_id, customer_id, amount, payment_date, payment_mode, notes)
         VALUES ($1, $2, $3, $4, 'cash', $5)`,
        [req.user.id, customer_id, parsedPaid, dateVal, `Payment for entry #${newEntry.id}`]
      );
    }

    newEntry.items = validatedItems;

    return res.status(201).json({
      success: true,
      message: 'Daily entry saved successfully.',
      entry: newEntry,
    });
  } catch (err) {
    console.error('Error creating daily entry:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/daily-entries/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const result = await query(
      `UPDATE daily_entries
       SET status = COALESCE($1, status),
           payment_status = COALESCE($2, payment_status)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status, payment_status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Daily entry not found.' });
    }

    return res.json({ success: true, entry: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/daily-entries/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM daily_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    return res.json({ success: true, message: 'Entry deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
