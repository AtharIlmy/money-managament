import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Database@localhost:5432/Money%20Managament';
    if (connectionString.includes(' ')) {
      connectionString = connectionString.replace(/ /g, '%20');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

export async function initDatabase() {
  try {
    const client = getPool();
    // Test connection
    const res = await client.query('SELECT current_database(), NOW()');
    console.log(`✅ Terhubung ke PostgreSQL Database: '${res.rows[0].current_database}'`);

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(10) DEFAULT '👤',
        phone_number VARCHAR(20),
        reminder_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        reminder_hour INTEGER DEFAULT 20 CHECK (reminder_hour >= 0 AND reminder_hour <= 23),
        phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
        last_reminder_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add phone/reminder columns if users table already existed
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_hour INTEGER DEFAULT 20`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reminder_date DATE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    // Ensure defaults
    await query(`ALTER TABLE users ALTER COLUMN reminder_enabled SET DEFAULT FALSE`);
    await query(`ALTER TABLE users ALTER COLUMN reminder_hour SET DEFAULT 20`);
    await query(`ALTER TABLE users ALTER COLUMN phone_verified SET DEFAULT FALSE`);
    await query(`ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP`);

    // Ensure NULL values in reminder_enabled and phone_verified are converted to FALSE
    await query(`UPDATE users SET reminder_enabled = FALSE WHERE reminder_enabled IS NULL`);
    await query(`UPDATE users SET phone_verified = FALSE WHERE phone_verified IS NULL`);
    await query(`UPDATE users SET reminder_hour = 20 WHERE reminder_hour IS NULL`);
    await query(`UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL`);

    // Check constraint for reminder_hour
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'check_users_reminder_hour'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT check_users_reminder_hour 
            CHECK (reminder_hour >= 0 AND reminder_hour <= 23);
        END IF;
      END $$;
    `);

    // Partial unique index for phone numbers
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
      ON users (phone_number) 
      WHERE phone_number IS NOT NULL AND phone_number != ''
    `);

    // Table for phone OTP verifications
    await query(`
      CREATE TABLE IF NOT EXISTS phone_otps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        phone_number VARCHAR(20) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        icon VARCHAR(10) DEFAULT '📌',
        color VARCHAR(20) DEFAULT '#84A98C',
        is_default BOOLEAN DEFAULT FALSE
      )
    `);

    // Wallets table
    await query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'checking',
        balance DECIMAL(15,2) DEFAULT 0,
        color VARCHAR(20) DEFAULT '#1B4332',
        icon VARCHAR(10) DEFAULT '💳',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        amount DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        description TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure tax_amount column in transactions if table existed
    await query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;
    `);

    // Budgets table
    await query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        period VARCHAR(20) DEFAULT 'monthly',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Goals table
    await query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target_amount DECIMAL(15,2) NOT NULL,
        current_amount DECIMAL(15,2) DEFAULT 0,
        deadline DATE,
        category VARCHAR(100) DEFAULT 'Umum',
        icon VARCHAR(10) DEFAULT '🎯',
        color VARCHAR(20) DEFAULT '#1B4332',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure category column in goals if table existed
    await query(`
      ALTER TABLE goals ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Umum';
    `);

    // Savings Logs (Riwayat Setor/Tarik Tabungan Impian)
    await query(`
      CREATE TABLE IF NOT EXISTS savings_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
        amount DECIMAL(15,2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
        note TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Bills / Subscriptions table (Tagihan Rutin & Pengingat)
    await query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        due_day INTEGER NOT NULL DEFAULT 1,
        category VARCHAR(100) DEFAULT 'Langganan',
        is_paid BOOLEAN DEFAULT FALSE,
        icon VARCHAR(10) DEFAULT '📅',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Skema tabel database PostgreSQL berhasil disiapkan');
  } catch (error) {
    console.error('⚠️ Peringatan koneksi PostgreSQL:', error.message);
    console.error('Pastikan PostgreSQL aktif dan URL koneksi di .env sudah sesuai.');
  }
}

export async function seedDefaultData(userId) {
  const defaultCategories = [
    // Pengeluaran
    { name: 'Makanan & Minuman', type: 'expense', icon: '🍜', color: '#E07A5F' },
    { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#3D405B' },
    { name: 'Belanja', type: 'expense', icon: '🛍️', color: '#F4A261' },
    { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#E9C46A' },
    { name: 'Kesehatan', type: 'expense', icon: '💊', color: '#2A9D8F' },
    { name: 'Tagihan', type: 'expense', icon: '📄', color: '#E76F51' },
    { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#264653' },
    { name: 'Lainnya', type: 'expense', icon: '💸', color: '#6D6875' },
    // Pemasukan
    { name: 'Gaji', type: 'income', icon: '💰', color: '#1B4332' },
    { name: 'Bisnis', type: 'income', icon: '💼', color: '#40916C' },
    { name: 'Investasi', type: 'income', icon: '📈', color: '#52796F' },
    { name: 'Hadiah', type: 'income', icon: '🎁', color: '#74C69D' },
    { name: 'Lainnya', type: 'income', icon: '💵', color: '#84A98C' },
  ];

  for (const cat of defaultCategories) {
    await query(
      `INSERT INTO categories (user_id, name, type, icon, color, is_default) 
       VALUES ($1, $2, $3, $4, $5, TRUE) ON CONFLICT DO NOTHING`,
      [userId, cat.name, cat.type, cat.icon, cat.color]
    );
  }

  // Create default checking wallet
  await query(
    `INSERT INTO wallets (user_id, name, type, balance, color, icon)
     VALUES ($1, 'Rekening Utama', 'checking', 0, '#1B4332', '🏦')`,
    [userId]
  );
}
