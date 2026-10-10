import { exec } from './db.js';

export async function migrate() {
  console.log('🚀 Running database migrations...');

  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      business_name VARCHAR(255) NOT NULL,
      business_type VARCHAR(100) DEFAULT 'laundry',
      phone VARCHAR(50),
      currency VARCHAR(10) DEFAULT '₹',
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      unit VARCHAR(50) DEFAULT 'pcs',
      price NUMERIC(10, 2) NOT NULL DEFAULT 0,
      icon VARCHAR(50) DEFAULT 'package',
      category VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS societies (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      address TEXT,
      code VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id SERIAL PRIMARY KEY,
      society_id INT REFERENCES societies(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      society_id INT REFERENCES societies(id) ON DELETE SET NULL,
      block_id INT REFERENCES blocks(id) ON DELETE SET NULL,
      unit_number VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(50),
      opening_balance NUMERIC(10, 2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_entries (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
      entry_date DATE NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total_items NUMERIC(10, 2) NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'collected',
      payment_status VARCHAR(50) DEFAULT 'unpaid',
      paid_amount NUMERIC(10, 2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_entry_items (
      id SERIAL PRIMARY KEY,
      daily_entry_id INT REFERENCES daily_entries(id) ON DELETE CASCADE,
      service_id INT REFERENCES services(id) ON DELETE SET NULL,
      service_name VARCHAR(150) NOT NULL,
      unit VARCHAR(50) DEFAULT 'pcs',
      unit_price NUMERIC(10, 2) NOT NULL,
      quantity NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'cash',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
    CREATE INDEX IF NOT EXISTS idx_societies_user ON societies(user_id);
    CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_customers_society ON customers(society_id);
    CREATE INDEX IF NOT EXISTS idx_customers_block ON customers(block_id);
    CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON daily_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_daily_entries_customer ON daily_entries(customer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
  `);

  console.log('✅ PostgreSQL database schema migrated successfully!');
}
