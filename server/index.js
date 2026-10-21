import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { initReminderScheduler } from './reminder.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import transactionsRoutes from './routes/transactions.js';
import walletsRoutes from './routes/wallets.js';
import budgetsRoutes from './routes/budgets.js';
import goalsRoutes from './routes/goals.js';
import categoriesRoutes from './routes/categories.js';
import reportsRoutes from './routes/reports.js';
import billsRoutes from './routes/bills.js';
import reminderRoutes from './routes/reminder.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS — Perbaikan izin origin untuk browser & Vercel
app.use(
  cors({
    origin: '*', // Mengizinkan request dari frontend mana pun (termasuk Vercel)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/reminder', reminderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve Vite frontend build if dist exists
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback for React Router
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server and initialize PostgreSQL
async function start() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Inisialisasi database terhambat:', err.message);
  }

  // Bind server ke '0.0.0.0' agar Railway dapat menerima koneksi publik
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Express API berjalan pada port ${PORT}`);
    // Start the daily WA reminder cron job
    initReminderScheduler();
  });
}

start();