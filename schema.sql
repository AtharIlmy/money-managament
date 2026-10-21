-- ====================================================
-- Script Database PostgreSQL: Money Management
-- Kompatibel dengan: Railway PostgreSQL, Supabase, Neon, pgAdmin, dan Local psql
-- ====================================================

-- ----------------------------------------------------
-- 1. TABEL USERS (Pengguna & Pengaturan Pengingat WA)
-- ----------------------------------------------------
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partial Unique Index untuk nomor WhatsApp (agar 1 nomor terverifikasi tidak ganda)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
ON users (phone_number) 
WHERE phone_number IS NOT NULL AND phone_number != '';

-- ----------------------------------------------------
-- 2. TABEL PHONE_OTPS (Verifikasi Kode OTP WhatsApp)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS phone_otps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 3. TABEL CATEGORIES (Kategori Pemasukan & Pengeluaran)
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
-- 4. TABEL WALLETS (Dompet, Rekening Bank & E-Wallet)
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
-- 5. TABEL TRANSACTIONS (Riwayat Transaksi Harian)
-- ----------------------------------------------------
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
-- 7. TABEL GOALS (Target Impian & Tabungan Finansial)
-- ----------------------------------------------------
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 8. TABEL SAVINGS_LOGS (Riwayat Setor & Tarik Tabungan)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS savings_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 9. TABEL BILLS (Tagihan Rutin & Pengingat Bulanan)
-- ----------------------------------------------------
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- 10. INDEX UNTUK PERFORMA QUERY CEPAT
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_logs_goal ON savings_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_logs_user ON savings_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone_number);
