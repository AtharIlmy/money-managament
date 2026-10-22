import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  '#0E2038', '#163259', '#2563EB', '#3B82F6', '#0D9488',
  '#10B981', '#F59E0B', '#E11D48', '#8B5CF6', '#64748B'
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2, color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill, marginTop: 4 }} />
            <span>
              {p.name}: <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(p.value)}</strong>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;
  const totalTax = data?.totalTax || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const avgDailyExpense = Math.round(totalExpense / (daysInMonth || 30));

  const categoryBreakdown = data?.categoryBreakdown || [];
  const monthlyTrends = data?.monthlyTrends || [];

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <>
      {/* Topbar matching reference */}
      <div className="topbar">
        <div className="topbar-left" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Ruang personal
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&gt;</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Laporan
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Data tersimpan
          </div>
          <NotificationButton />
          <select
            className="form-select"
            style={{ width: '140px', padding: '6px 28px 6px 10px', fontSize: 13 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: '100px', padding: '6px 28px 6px 10px', fontSize: 13 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-content">
        {/* Signature Biru Dongker Hero Banner (Matching Arus Mockup) */}
        <div className="navy-banner">
          <div className="navy-banner-left">
            <h1 className="navy-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="analytics" size={26} /> Laporan Keuangan
            </h1>
            <p className="navy-banner-subtitle">
              Analisis performa finansial periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
            </p>
            <div className="navy-banner-actions">
              <span className="navy-banner-btn">
                Rasio Tabungan: {savingsRate}%
              </span>
              <span className="navy-banner-btn" style={{ background: 'rgba(217, 119, 6, 0.25)', borderColor: 'rgba(217, 119, 6, 0.4)' }}>
                🏷️ Pajak & Admin: {formatRupiah(totalTax)}
              </span>
              <span className="navy-banner-btn">
                Status: {netSavings >= 0 ? 'Surplus Finansial ✓' : 'Defisit Anggaran ⚠'}
              </span>
            </div>
          </div>

          <div className="navy-banner-right">
            <div className="navy-banner-stat-box">
              <div className="navy-banner-stat-label">Tabungan Bersih Periode Ini</div>
              <div
                className="navy-banner-stat-value"
                style={{ color: netSavings >= 0 ? 'var(--primary)' : 'var(--danger)' }}
              >
                {formatRupiah(netSavings)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {savingsRate}% dari total arus masuk
              </div>
            </div>
          </div>
        </div>

        {/* 5 Summary Stat Cards */}
        <div className="reports-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-label">
              <span>Total Pemasukan</span>
              <Icon name="payments" size={18} color="var(--income-color)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--income-color)' }}>
              {formatRupiah(totalIncome)}
            </div>
            <div className="stat-card-change up">↑ Arus Masuk</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Total Pengeluaran</span>
              <Icon name="shopping_cart" size={18} color="var(--expense-color)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--expense-color)' }}>
              {formatRupiah(totalExpense)}
            </div>
            <div className="stat-card-change down">↓ Arus Keluar</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Pajak & Biaya Admin</span>
              <Icon name="receipt_long" size={18} color="#D97706" />
            </div>
            <div className="stat-card-value" style={{ color: '#D97706' }}>
              {formatRupiah(totalTax)}
            </div>
            <div className="stat-card-change">Biaya layanan terpisah</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Tabungan Bersih</span>
              <Icon name="account_balance" size={18} color="var(--primary)" />
            </div>
            <div
              className="stat-card-value"
              style={{ color: netSavings >= 0 ? 'var(--primary)' : 'var(--danger)' }}
            >
              {formatRupiah(netSavings)}
            </div>
            <div className="stat-card-change">
              {netSavings >= 0 ? `Surplus ${savingsRate}%` : 'Defisit Keuangan'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Rata-Rata Harian</span>
              <Icon name="calendar_today" size={18} color="var(--text-secondary)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--text-primary)' }}>
              {formatRupiah(avgDailyExpense)}
            </div>
            <div className="stat-card-change">/ hari belanja</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid-2-1" style={{ marginBottom: 24 }}>
          {/* Monthly Bar Comparison */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Perbandingan Pemasukan vs Pengeluaran</div>
                <div className="card-subtitle">Tren bulanan tahun {selectedYear}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, background: '#0E2038', borderRadius: 2 }} /> Pemasukan
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, background: '#E11D48', borderRadius: 2 }} /> Pengeluaran
                </span>
              </div>
            </div>
            <div className="card-body">
              {monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Pemasukan" fill="#0E2038" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pengeluaran" fill="#E11D48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><Icon name="analytics" size={40} /></div>
                  <div className="empty-state-title">Belum ada catatan tahunan</div>
                </div>
              )}
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Distribusi Pengeluaran</div>
                <div className="card-subtitle">Proporsi kategori belanja</div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {categoryBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatRupiah(value)} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={{ width: '100%', marginTop: 8, maxHeight: 110, overflowY: 'auto' }}>
                    {categoryBreakdown.map((cat, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                          padding: '4px 0',
                          borderBottom: '1px solid var(--border-light)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                          {cat.name}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatRupiah(cat.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: '36px 12px' }}>
                  <div className="empty-state-icon"><Icon name="pie_chart" size={40} /></div>
                  <div className="empty-state-title">Belum ada data kategori</div>
                  <div className="empty-state-text" style={{ fontSize: 12 }}>
                    Catat pengeluaran untuk melihat diagram alokasi
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ringkasan & Rekomendasi Finansial */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lightbulb" size={20} color="var(--warning)" /> Ringkasan &amp; Analisis Finansial
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ background: 'var(--primary-50)', padding: 16, borderRadius: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                Rasio Tabungan ({savingsRate}%)
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {savingsRate >= 20
                  ? 'Sangat baik! Anda menyisihkan lebih dari 20% penghasilan untuk masa depan.'
                  : savingsRate > 0
                  ? 'Bagus, ada surplus yang tersimpan. Tingkatkan alokasi menuju target ideal 20%.'
                  : 'Pengeluaran melebihi pemasukan. Evaluasi kategori pengeluaran terbesar Anda.'}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Rata-rata Harian
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Pengeluaran rata-rata harian Anda adalah <strong>{formatRupiah(avgDailyExpense)}</strong>.
                Menjaga pengeluaran harian di bawah angka ini dapat meningkatkan tabungan bulanan.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
