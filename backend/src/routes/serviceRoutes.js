import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM services WHERE user_id = $1 AND is_active = TRUE ORDER BY id ASC',
      [req.user.id]
    );
    return res.json({ success: true, services: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { name, unit = 'pcs', price = 0, icon = 'package', category = 'General' } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Service name and price are required.' });
    }

    const result = await query(
      `INSERT INTO services (user_id, name, unit, price, icon, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name.trim(), unit.trim(), parseFloat(price) || 0, icon, category]
    );

    return res.status(201).json({ success: true, service: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, price, icon, category, is_active } = req.body;

    const result = await query(
      `UPDATE services
       SET name = COALESCE($1, name),
           unit = COALESCE($2, unit),
           price = COALESCE($3, price),
           icon = COALESCE($4, icon),
           category = COALESCE($5, category),
           is_active = COALESCE($6, is_active)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, unit, price !== undefined ? parseFloat(price) : null, icon, category, is_active, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    return res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE services SET is_active = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    return res.json({ success: true, message: 'Service removed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
