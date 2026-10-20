import pg from 'pg';

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Database@localhost:5432/Money%20Managament';
    if (connectionString.includes(' ')) {
      connectionString = connectionString.replace(/ /g, '%20');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  const result = await client.query(text, params);
  return result;
}

export async function initDatabase() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(10) DEFAULT '👤',
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
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        description TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
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
        icon VARCHAR(10) DEFAULT '🎯',
        color VARCHAR(20) DEFAULT '#1B4332',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
}

export async function seedDefaultCategories(userId) {
  const defaultCategories = [
    // Expense
    { name: 'Makanan & Minuman', type: 'expense', icon: '🍜', color: '#E07A5F' },
    { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#3D405B' },
    { name: 'Belanja', type: 'expense', icon: '🛍️', color: '#F4A261' },
    { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#E9C46A' },
    { name: 'Kesehatan', type: 'expense', icon: '💊', color: '#2A9D8F' },
    { name: 'Tagihan', type: 'expense', icon: '📄', color: '#E76F51' },
    { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#264653' },
    { name: 'Lainnya', type: 'expense', icon: '💸', color: '#6D6875' },
    // Income
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
}
