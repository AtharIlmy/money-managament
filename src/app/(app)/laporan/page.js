'use client';
import { useState, useEffect } from 'react';
import { formatRupiah, getMonthName } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import ThemeToggleBtn from '@/app/components/ThemeToggleBtn';
import { useTheme } from '@/app/components/ThemeProvider';

const COLORS = ['#1B4332', '#40916C', '#52796F', '#84A98C', '#E76F51', '#E9C46A', '#F4A261', '#3D405B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
        <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2, color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill, marginTop: 3 }} />
            <span>{p.name}: <strong style={{ color: '#000000' }}>{formatRupiah(p.value)}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LaporanPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  const chartGrid = isDark ? '#2D3F55' : '#F0EEE8';
  const chartAxis = isDark ? '#64748B' : '#9CA3AF';
  const chartIncome = isDark ? '#34D399' : '#1B4332';
  const chartExpense = isDark ? '#F87171' : '#DC2626';

  const now = new Date();
  const periods = {
    month: {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now),
    },
    quarter: {
      start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0],
      label: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`,
    },
    year: {
      start: `${now.getFullYear()}-01-01`,
      end: `${now.getFullYear()}-12-31`,
      label: `Tahun ${now.getFullYear()}`,
    },
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const p = periods[period];
      const res = await fetch(`/api/reports?start_date=${p.start}&end_date=${p.end}`);
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [period]);

  const pieData = data?.top_categories?.filter(c => parseFloat(c.total) > 0).map((c, i) => ({
    name: `${c.icon} ${c.name}`,
    value: parseFloat(c.total),
    color: c.color || COLORS[i % COLORS.length],
  })) || [];

  const monthlyData = data?.monthly?.map(m => ({
    label: `${getMonthName(parseInt(m.month_num) - 1)} '${String(m.year).slice(-2)}`,
    Pemasukan: parseFloat(m.income),
    Pengeluaran: parseFloat(m.expense),
  })) || [];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Laporan</span>
          <span className="topbar-title">Laporan Keuangan</span>
        </div>
        <div className="topbar-right">
          <ThemeToggleBtn />
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ v: 'month', l: 'Bulan ini' }, { v: 'quarter', l: 'Kuartal' }, { v: 'year', l: 'Tahun ini' }].map(opt => (
              <button key={opt.v} className={`chip ${period === opt.v ? 'active' : ''}`} onClick={() => setPeriod(opt.v)}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Period label */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Laporan keuangan periode <strong style={{ color: 'var(--text-primary)' }}>{periods[period].label}</strong>
        </p>

        {/* Summary cards */}
        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
          <div className="stat-card primary">
            <div className="stat-card-label">Pemasukan</div>
            <div className="stat-card-value" style={{ color: '#000000' }}>{formatRupiah(data?.summary?.total_income || 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Pengeluaran</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : 'var(--expense-color)' }}>{formatRupiah(data?.summary?.total_expense || 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Tabungan Bersih</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : ((data?.summary?.net || 0) >= 0 ? 'var(--primary)' : 'var(--danger)') }}>
              {formatRupiah(data?.summary?.net || 0)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Transaksi</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : undefined }}>{data?.summary?.total_transactions || 0}</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid-2-1" style={{ marginBottom: 20 }}>
          {/* Bar chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Tren Pemasukan & Pengeluaran</div>
                <div className="card-subtitle">6 bulan terakhir</div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading"><div className="spinner" /></div>
              ) : monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barGap={4} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: chartAxis }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Bar dataKey="Pemasukan" fill={chartIncome} radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="Pengeluaran" fill={chartExpense} radius={[4, 4, 0, 0]} barSize={18} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">Belum ada data</div>
                </div>
              )}
            </div>
          </div>

          {/* Pie chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Distribusi Pengeluaran</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {loading ? (
                <div className="loading"><div className="spinner" /></div>
              ) : pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatRupiah(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ width: '100%', marginTop: 8 }}>
                    {pieData.slice(0, 5).map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: isDark ? '#000000' : undefined }}>{formatRupiah(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🥧</div>
                  <div className="empty-state-title">Belum ada data</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid-2">
          {/* Income sources */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Sumber Pemasukan</div>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {(data?.income_sources || []).length > 0 ? (
                data.income_sources.map((src, i) => (
                  <div key={i} className="info-row">
                    <span className="info-label">{src.icon} {src.name}</span>
                    <span className="info-value" style={{ color: isDark ? '#000000' : 'var(--primary)' }}>{formatRupiah(src.total)}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-title">Belum ada pemasukan</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Transaksi Terbaru</div>
            </div>
            <div style={{ padding: '0 4px' }}>
              {(data?.recent_transactions || []).length > 0 ? (
                data.recent_transactions.slice(0, 6).map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="tx-icon" style={{ background: `${tx.category_color || '#84A98C'}20`, width: 30, height: 30, borderRadius: 8, fontSize: 14 }}>
                        {tx.category_icon || '💸'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.category_name || 'Lainnya'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(tx.date))}
                        </div>
                      </div>
                    </div>
                    <span className={`tx-amount ${tx.type}`} style={{ fontSize: 13, color: isDark ? '#000000' : undefined }}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-title">Belum ada transaksi</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
