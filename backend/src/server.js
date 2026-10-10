import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, getDbType, query } from './config/db.js';
import { migrate } from './config/migrate.js';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import dailyEntryRoutes from './routes/dailyEntryRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health & System status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RouteFlow API',
    dbEngine: getDbType(),
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/daily-entries', dailyEntryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Automatic seed generator for instant ready-to-use experience
async function seedInitialDemoData() {
  try {
    const userCheck = await query("SELECT id FROM users WHERE email = 'demo@routeflow.io'");
    if (userCheck.rows.length === 0) {
      console.log('🌱 Seeding initial demo business (Vaniq Laundry & Dry Cleaning)...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('demo123', salt);

      const uRes = await query(
        `INSERT INTO users (email, password_hash, business_name, business_type, phone, address, currency)
         VALUES ('demo@routeflow.io', $1, 'Vaniq Fresh Laundry & Pressing', 'laundry', '+91 98765 43210', 'Shop 4, Nilkanth Arcade, Satellite, Ahmedabad', '₹')
         RETURNING id`,
        [hash]
      );
      const userId = uRes.rows[0].id;

      // Seed Services
      const s1 = await query(`INSERT INTO services (user_id, name, unit, price, icon, category) VALUES ($1, 'Ironing / Pressing', 'pcs', 8, 'iron', 'Ironing') RETURNING id`, [userId]);
      const s2 = await query(`INSERT INTO services (user_id, name, unit, price, icon, category) VALUES ($1, 'Wash & Iron', 'pcs', 16, 'sparkles', 'Washing') RETURNING id`, [userId]);
      const s3 = await query(`INSERT INTO services (user_id, name, unit, price, icon, category) VALUES ($1, 'Dry Cleaning (Shirt/Pant)', 'pcs', 120, 'hanger', 'Dry Clean') RETURNING id`, [userId]);
      const s4 = await query(`INSERT INTO services (user_id, name, unit, price, icon, category) VALUES ($1, 'Suit / Blazer Dry Clean', 'pcs', 250, 'suit', 'Dry Clean') RETURNING id`, [userId]);
      const s5 = await query(`INSERT INTO services (user_id, name, unit, price, icon, category) VALUES ($1, 'Blanket Wash', 'pcs', 200, 'bed', 'Special') RETURNING id`, [userId]);

      // Seed Societies & Blocks
      const soc1 = await query(`INSERT INTO societies (user_id, name, address, code) VALUES ($1, 'Shivalik Greens', 'B/H Rajpath Club, Bodakdev', 'SG') RETURNING id`, [userId]);
      const soc2 = await query(`INSERT INTO societies (user_id, name, address, code) VALUES ($1, 'Radhe Residency', 'Near Science City Road', 'RR') RETURNING id`, [userId]);

      const b1 = await query(`INSERT INTO blocks (society_id, name) VALUES ($1, 'Block A') RETURNING id`, [soc1.rows[0].id]);
      const b2 = await query(`INSERT INTO blocks (society_id, name) VALUES ($1, 'Block B') RETURNING id`, [soc1.rows[0].id]);
      const b3 = await query(`INSERT INTO blocks (society_id, name) VALUES ($1, 'Block C') RETURNING id`, [soc1.rows[0].id]);
      const b4 = await query(`INSERT INTO blocks (society_id, name) VALUES ($1, 'Wing 1') RETURNING id`, [soc2.rows[0].id]);

      // Seed Customers
      const c1 = await query(
        `INSERT INTO customers (user_id, society_id, block_id, unit_number, name, phone, opening_balance)
         VALUES ($1, $2, $3, 'A/302', 'Rameshbhai Patel', '+91 98250 11223', 0) RETURNING id`,
        [userId, soc1.rows[0].id, b1.rows[0].id]
      );
      const c2 = await query(
        `INSERT INTO customers (user_id, society_id, block_id, unit_number, name, phone, opening_balance)
         VALUES ($1, $2, $3, 'A/501', 'Priya Shah', '+91 98980 44556', 50) RETURNING id`,
        [userId, soc1.rows[0].id, b1.rows[0].id]
      );
      const c3 = await query(
        `INSERT INTO customers (user_id, society_id, block_id, unit_number, name, phone, opening_balance)
         VALUES ($1, $2, $3, 'B/901', 'Amit Verma', '+91 97120 77889', 0) RETURNING id`,
        [userId, soc1.rows[0].id, b2.rows[0].id]
      );
      const c4 = await query(
        `INSERT INTO customers (user_id, society_id, block_id, unit_number, name, phone, opening_balance)
         VALUES ($1, $2, $3, 'W-104', 'Deepak Mehta', '+91 99090 33221', 120) RETURNING id`,
        [userId, soc2.rows[0].id, b4.rows[0].id]
      );

      // Seed realistic daily entries for today and yesterday
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Entry 1: A/302 - 14 Ironing
      const de1 = await query(
        `INSERT INTO daily_entries (user_id, customer_id, entry_date, total_amount, total_items, status, payment_status, notes)
         VALUES ($1, $2, $3, 112, 14, 'collected', 'unpaid', '14 cotton shirts collected') RETURNING id`,
        [userId, c1.rows[0].id, today]
      );
      await query(
        `INSERT INTO daily_entry_items (daily_entry_id, service_id, service_name, unit, unit_price, quantity, total_price)
         VALUES ($1, $2, 'Ironing / Pressing', 'pcs', 8, 14, 112)`,
        [de1.rows[0].id, s1.rows[0].id]
      );

      // Entry 2: B/901 - 88 Ironing + 3 Dry Cleaning
      const de2 = await query(
        `INSERT INTO daily_entries (user_id, customer_id, entry_date, total_amount, total_items, status, payment_status, notes)
         VALUES ($1, $2, $3, 1064, 91, 'in_process', 'unpaid', '88 cloths + 3 Dry cleaning shirts') RETURNING id`,
        [userId, c3.rows[0].id, today]
      );
      await query(
        `INSERT INTO daily_entry_items (daily_entry_id, service_id, service_name, unit, unit_price, quantity, total_price)
         VALUES ($1, $2, 'Ironing / Pressing', 'pcs', 8, 88, 704)`,
        [de2.rows[0].id, s1.rows[0].id]
      );
      await query(
        `INSERT INTO daily_entry_items (daily_entry_id, service_id, service_name, unit, unit_price, quantity, total_price)
         VALUES ($1, $2, 'Dry Cleaning (Shirt/Pant)', 'pcs', 120, 3, 360)`,
        [de2.rows[0].id, s3.rows[0].id]
      );

      // Entry 3: A/501 - Yesterday 6 Wash & Iron
      const de3 = await query(
        `INSERT INTO daily_entries (user_id, customer_id, entry_date, total_amount, total_items, status, payment_status, paid_amount)
         VALUES ($1, $2, $3, 96, 6, 'delivered', 'paid', 96) RETURNING id`,
        [userId, c2.rows[0].id, yesterday]
      );
      await query(
        `INSERT INTO daily_entry_items (daily_entry_id, service_id, service_name, unit, unit_price, quantity, total_price)
         VALUES ($1, $2, 'Wash & Iron', 'pcs', 16, 6, 96)`,
        [de3.rows[0].id, s2.rows[0].id]
      );
      await query(
        `INSERT INTO payments (user_id, customer_id, amount, payment_date, payment_mode, notes)
         VALUES ($1, $2, 96, $3, 'cash', 'Full payment collected on delivery')`,
        [userId, c2.rows[0].id, yesterday]
      );

      console.log('✅ Demo seed completed! Credentials: demo@routeflow.io / demo123');
    }
  } catch (err) {
    console.warn('Seed warning:', err.message);
  }
}

// Start Server
async function startServer() {
  try {
    await initDb();
    await migrate();
    await seedInitialDemoData();

    app.listen(PORT, () => {
      console.log(`🚀 RouteFlow Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
