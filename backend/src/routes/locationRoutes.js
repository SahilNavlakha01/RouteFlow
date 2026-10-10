import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/locations - Get all societies with their blocks and customer counts
router.get('/', async (req, res) => {
  try {
    const societiesRes = await query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM blocks b WHERE b.society_id = s.id) AS block_count,
              (SELECT COUNT(*) FROM customers c WHERE c.society_id = s.id) AS customer_count
       FROM societies s
       WHERE s.user_id = $1
       ORDER BY s.name ASC`,
      [req.user.id]
    );

    const blocksRes = await query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM customers c WHERE c.block_id = b.id) AS customer_count
       FROM blocks b
       JOIN societies s ON b.society_id = s.id
       WHERE s.user_id = $1
       ORDER BY b.name ASC`,
      [req.user.id]
    );

    // Group blocks under respective societies
    const societiesMap = {};
    for (const soc of societiesRes.rows) {
      societiesMap[soc.id] = { ...soc, blocks: [] };
    }

    for (const block of blocksRes.rows) {
      if (societiesMap[block.society_id]) {
        societiesMap[block.society_id].blocks.push(block);
      }
    }

    return res.json({
      success: true,
      societies: Object.values(societiesMap),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/locations/societies - Create society
router.post('/societies', async (req, res) => {
  try {
    const { name, address = '', code = '', initialBlocks = [] } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Society / Complex name is required.' });
    }

    const socResult = await query(
      `INSERT INTO societies (user_id, name, address, code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, name.trim(), address.trim(), code.trim()]
    );

    const newSociety = socResult.rows[0];
    newSociety.blocks = [];

    // If initial blocks passed (e.g., ['A', 'B', 'C'] or ['Wing A', 'Wing B'])
    if (Array.isArray(initialBlocks) && initialBlocks.length > 0) {
      for (const blockName of initialBlocks) {
        if (blockName && blockName.trim()) {
          const bRes = await query(
            `INSERT INTO blocks (society_id, name) VALUES ($1, $2) RETURNING *`,
            [newSociety.id, blockName.trim()]
          );
          newSociety.blocks.push(bRes.rows[0]);
        }
      }
    }

    return res.status(201).json({ success: true, society: newSociety });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/locations/societies/:id - Update society
router.put('/societies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, code } = req.body;

    const result = await query(
      `UPDATE societies
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           code = COALESCE($3, code)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, address, code, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    return res.json({ success: true, society: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/locations/societies/:id - Delete society
router.delete('/societies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM societies WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    return res.json({ success: true, message: 'Society deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/locations/societies/:id/blocks - Add block/wing to society
router.post('/societies/:id/blocks', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Block / Wing name is required.' });
    }

    // Verify ownership
    const socCheck = await query('SELECT id FROM societies WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (socCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    const result = await query(
      `INSERT INTO blocks (society_id, name) VALUES ($1, $2) RETURNING *`,
      [id, name.trim()]
    );

    return res.status(201).json({ success: true, block: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/locations/blocks/:id - Delete block
router.delete('/blocks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership through society
    const check = await query(
      `SELECT b.id FROM blocks b
       JOIN societies s ON b.society_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Block not found.' });
    }

    await query('DELETE FROM blocks WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Block deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
