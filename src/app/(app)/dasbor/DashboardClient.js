'use client';
import { formatRupiah, formatDateShort } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import ThemeToggleBtn from '@/app/components/ThemeToggleBtn';
import { useTheme } from '@/app/components/ThemeProvider';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
        <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.name}: </span>
            <span style={{ fontWeight: 700, color: '#000000' }}>{formatRupiah(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardClient({ data, userName }) {
  const { income, expense, balance, monthly, recent, categories, month } = data;
  const savings = income - expense;
  const { isDark } = useTheme();

  const firstName = userName?.split(' ')[0] || 'Pengguna';

  // Chart colors berdasarkan theme
  const chartIncome = isDark ? '#34D399' : '#1B4332';
  const chartExpense = isDark ? '#F87171' : '#DC2626';
  const chartGrid = isDark ? '#2D3F55' : '#F0EEE8';
  const chartAxis = isDark ? '#64748B' : '#9CA3AF';

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Dasbor</span>
          <span className="topbar-title">Dasbor</span>
        </div>
        <div className="topbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}
          </span>
          <ThemeToggleBtn />
        </div>
      </div>

      <div className="page-content">
        {/* Welcome */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Selamat sore, {firstName} 👋
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Berikut ringkasan keuangan Anda bulan {month}. Semangat terus dalam mengelola keuangan!
          </p>
        </div>

        {/* Stat cards */}
        <div className="stat-cards">
          <div className="stat-card primary">
            <div className="stat-card-label">Total Saldo</div>
            <div className="stat-card-value" style={{ color: '#000000' }}>{formatRupiah(balance)}</div>
            <div className="stat-card-change">💳 Semua dompet</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Pemasukan</div>
            <div className="stat-card-value" style={{ color: '#000000' }}>{formatRupiah(income)}</div>
            <div className="stat-card-change up">↑ Bulan ini</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Pengeluaran</div>
            <div className="stat-card-value" style={{ color: '#000000' }}>{formatRupiah(expense)}</div>
            <div className="stat-card-change down">↓ Bulan ini</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Tabungan bersih</div>
            <div className="stat-card-value" style={{ color: '#000000' }}>
              {formatRupiah(savings)}
            </div>
            <div className="stat-card-change" style={{ color: savings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {savings >= 0 ? '✓ Surplus' : '✗ Defisit'}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid-2-1" style={{ marginBottom: 20 }}>
          {/* Area chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Tren Keuangan</div>
                <div className="card-subtitle">6 bulan terakhir</div>
              </div>
            </div>
            <div className="card-body">
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthly} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartIncome} stopOpacity={isDark ? 0.25 : 0.15}/>
                        <stop offset="95%" stopColor={chartIncome} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartExpense} stopOpacity={isDark ? 0.2 : 0.1}/>
                        <stop offset="95%" stopColor={chartExpense} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: chartAxis }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Pemasukan" stroke={chartIncome} strokeWidth={2} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke={chartExpense} strokeWidth={2} fill="url(#expenseGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">Belum ada data</div>
                  <div className="empty-state-text">Mulai tambah transaksi untuk melihat tren</div>
                </div>
              )}
            </div>
          </div>

          {/* Top categories */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Pengeluaran terbesar</div>
                <div className="card-subtitle">Bulan ini</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {categories.filter(c => parseFloat(c.total) > 0).length > 0 ? (
                categories.filter(c => parseFloat(c.total) > 0).slice(0, 5).map((cat, i) => {
                  const maxTotal = Math.max(...categories.map(c => parseFloat(c.total)));
                  const pct = maxTotal > 0 ? (parseFloat(cat.total) / maxTotal) * 100 : 0;
                  return (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{cat.icon}</span> {cat.name}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#000000' }}>{formatRupiah(cat.total)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: cat.color || 'var(--primary)' }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-icon">💸</div>
                  <div className="empty-state-title">Belum ada pengeluaran</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Transaksi terbaru</div>
              <div className="card-subtitle">Aktivitas keuangan terakhir</div>
            </div>
            <a href="/transaksi" className="btn btn-secondary btn-sm">Lihat semua →</a>
          </div>
          {recent.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Dompet</th>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th style={{ textAlign: 'right' }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div className="tx-category">
                        <div className="tx-icon" style={{ background: `${tx.cat_color || '#84A98C'}20` }}>
                          {tx.cat_icon || '💸'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.cat_name || 'Lainnya'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.description || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tx.wallet_name || '-'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDateShort(tx.date)}</td>
                    <td>
                      <span className={`badge badge-${tx.type}`}>
                        {tx.type === 'income' ? 'Masuk' : tx.type === 'expense' ? 'Keluar' : 'Transfer'}
                      </span>
                    </td>
                     <td style={{ textAlign: 'right' }}>
                      <span className={`tx-amount ${tx.type}`} style={{ color: '#000000' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Belum ada transaksi</div>
              <div className="empty-state-text">Tambah transaksi pertama Anda</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
