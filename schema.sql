-- ====================================================
-- Script Database PostgreSQL: Money Management
-- Bisa dijalankan di pgAdmin Query Tool atau psql
-- ====================================================

-- 1. Buat Database (Jalankan terpisah jika belum ada)
-- CREATE DATABASE arus_db;

-- Hubungkan ke database:
-- \c arus_db;

-- ----------------------------------------------------
-- 2. TABEL USERS (Pengguna)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 3. TABEL CATEGORIES (Kategori Transaksi)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(10) DEFAULT '📌',
    color VARCHAR(20) DEFAULT '#84A98C',
    is_default BOOLEAN DEFAULT FALSE
);

-- ----------------------------------------------------
-- 4. TABEL WALLETS (Dompet & Rekening)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'checking',
    balance DECIMAL(15,2) DEFAULT 0,
    color VARCHAR(20) DEFAULT '#1B4332',
    icon VARCHAR(10) DEFAULT '💳',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 5. TABEL TRANSACTIONS (Riwayat Transaksi)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 6. TABEL BUDGETS (Anggaran Bulanan per Kategori)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 7. TABEL GOALS (Target Impian Finansial / Tabungan)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    deadline DATE,
    icon VARCHAR(10) DEFAULT '🎯',
    color VARCHAR(20) DEFAULT '#1B4332',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 8. INDEX UNTUK PERFORMA QUERY
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
