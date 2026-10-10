import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to seed sensible default services based on business type
async function seedDefaultServices(userId, businessType = 'laundry') {
  const catalog = {
    laundry: [
      { name: 'Ironing / Pressing', unit: 'pcs', price: 8, icon: 'iron', category: 'Ironing' },
      { name: 'Wash & Fold', unit: 'kg', price: 50, icon: 'shirt', category: 'Washing' },
      { name: 'Wash & Iron', unit: 'pcs', price: 16, icon: 'sparkles', category: 'Washing' },
      { name: 'Dry Cleaning (Shirt/Pant)', unit: 'pcs', price: 120, icon: 'hanger', category: 'Dry Clean' },
      { name: 'Suit / Blazer Dry Clean', unit: 'pcs', price: 250, icon: 'suit', category: 'Dry Clean' },
      { name: 'Blanket / Quilt Wash', unit: 'pcs', price: 200, icon: 'bed', category: 'Special' },
    ],
    tiffin: [
      { name: 'Standard Veg Meal', unit: 'meal', price: 80, icon: 'utensils', category: 'Meals' },
      { name: 'Special Lunch (with Sweet)', unit: 'meal', price: 110, icon: 'utensils', category: 'Meals' },
      { name: 'Evening Light Dinner', unit: 'meal', price: 75, icon: 'coffee', category: 'Meals' },
      { name: 'Extra Roti (5 Pcs)', unit: 'pack', price: 30, icon: 'disc', category: 'Add-on' },
      { name: 'Curd / Buttermilk Bowl', unit: 'cup', price: 20, icon: 'glass', category: 'Add-on' },
    ],
    grocery: [
      { name: 'Fresh Milk (Amul Gold 1L)', unit: 'ltr', price: 68, icon: 'milk', category: 'Dairy' },
      { name: 'Curd / Dahi (500g)', unit: 'pack', price: 35, icon: 'box', category: 'Dairy' },
      { name: 'Whole Wheat Bread', unit: 'pack', price: 45, icon: 'package', category: 'Bakery' },
      { name: 'Farm Fresh Eggs (6 Pcs)', unit: 'tray', price: 48, icon: 'egg', category: 'Poultry' },
      { name: 'Mineral Water (20L Can)', unit: 'can', price: 35, icon: 'droplet', category: 'Beverage' },
    ],
    other: [
      { name: 'Daily Service Visit', unit: 'visit', price: 100, icon: 'check-circle', category: 'General' },
      { name: 'Standard Package', unit: 'pack', price: 250, icon: 'package', category: 'General' },
      { name: 'Premium Service', unit: 'service', price: 500, icon: 'sparkles', category: 'General' },
    ]
  };

  const defaultItems = catalog[businessType] || catalog.laundry;
  for (const item of defaultItems) {
    await query(
      `INSERT INTO services (user_id, name, unit, price, icon, category) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, item.name, item.unit, item.price, item.icon, item.category]
    );
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName, businessType = 'laundry', phone = '', address = '', currency = '₹' } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({ success: false, message: 'Email, password, and business name are required.' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await query(
      `INSERT INTO users (email, password_hash, business_name, business_type, phone, address, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, business_name, business_type, phone, address, currency, created_at`,
      [email.toLowerCase().trim(), passwordHash, businessName.trim(), businessType, phone, address, currency]
    );

    const newUser = insertResult.rows[0];

    // Seed default services for convenience
    await seedDefaultServices(newUser.id, businessType);

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      business_name: newUser.business_name,
      business_type: newUser.business_type,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      business_name: user.business_name,
      business_type: user.business_type,
    });

    const { password_hash, ...safeUser } = user;
    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, business_name, business_type, phone, address, currency, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { businessName, phone, address, currency, businessType } = req.body;
    const result = await query(
      `UPDATE users
       SET business_name = COALESCE($1, business_name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           currency = COALESCE($4, currency),
           business_type = COALESCE($5, business_type)
       WHERE id = $6
       RETURNING id, email, business_name, business_type, phone, address, currency, created_at`,
      [businessName, phone, address, currency, businessType, req.user.id]
    );

    return res.json({ success: true, message: 'Profile updated successfully.', user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
