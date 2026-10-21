import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';
import { checkAndSendDailyReminder } from '../lib/notifications';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 12,
          boxShadow: 'var(--shadow-md)',
          color: 'var(--text-primary)',
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.name}: </span>
            <span style={{ fontWeight: 700 }}>{formatRupiah(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();
  const [loading, setLoading] = useState(true);
  const [rightWidgetTab, setRightWidgetTab] = useState('categories');
  const [data, setData] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    totalSavings: 0,
    dailyAvgExpense: 0,
    avgPerTransaction: 0,
    expenseTxCount: 0,
    daysElapsed: 1,
    topExpenseCategory: null,
    topExpenseCategories: [],
    topExpenseTransaction: null,
    trendData: [],
    recentTransactions: [],
    budgets: [],
  });

  // Generate dynamic period options based on real current date
  const INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const defaultPeriodName = `${INDONESIAN_MONTHS[currentMonthIdx]} ${currentYear}`;

  const dynamicPeriodOptions = React.useMemo(() => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      options.push({
        label: `${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
    }
    options.push({
      label: `Tahun ${currentYear}`,
      month: null,
      year: currentYear,
    });
    return options;
  }, [currentMonthIdx, currentYear]);

  // Period dropdown state
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriodName);
  const [selectedPeriodOption, setSelectedPeriodOption] = useState(() => ({
    label: defaultPeriodName,
    month: currentMonthIdx + 1,
    year: currentYear,
  }));
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Close period dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#period-dropdown-wrapper')) {
        setShowPeriodDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        let url = '/api/dashboard/summary';
        if (selectedPeriodOption) {
          if (selectedPeriodOption.month) {
            url += `?month=${selectedPeriodOption.month}&year=${selectedPeriodOption.year}`;
          } else if (selectedPeriodOption.year) {
            url += `?year=${selectedPeriodOption.year}`;
          }
        }
        const res = await authFetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedPeriodOption]);

  const {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    totalSavings,
    dailyAvgExpense,
    avgPerTransaction,
    expenseTxCount: serverExpenseCount,
    daysElapsed,
    topExpenseCategory,
    topExpenseCategories,
    topExpenseTransaction,
    trendData,
    recentTransactions,
    budgets,
  } = data;

  const userName = user?.name ? user.name.split(' ')[0] : 'Nadia';
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

  // Real display values from database (starts from 0 if no data)
  const displayTotalBalance = parseFloat(totalBalance || 0);
  const displayIncome = parseFloat(monthlyIncome || 0);
  const displayExpense = parseFloat(monthlyExpense || 0);
  const displaySavings = parseFloat(totalSavings || 0);
  const surplus = displayIncome - displayExpense;

  const currentDay = daysElapsed || Math.max(1, new Date().getDate());
  const displayDailyAvg = dailyAvgExpense !== undefined ? parseFloat(dailyAvgExpense || 0) : (displayExpense > 0 ? Math.round(displayExpense / currentDay) : 0);
  const displayAvgPerTx = avgPerTransaction !== undefined ? parseFloat(avgPerTransaction || 0) : 0;
  const expenseCount = serverExpenseCount || (recentTransactions || []).filter((t) => t.type === 'expense').length;

  const incomeTxCount = (recentTransactions || []).filter((t) => t.type === 'income').length;
  const expenseRatio = displayIncome > 0 ? ((displayExpense / displayIncome) * 100).toFixed(1) : (displayExpense > 0 ? '100' : '0');

  // Chart data from server or empty 0s
  const chartData = (trendData && trendData.length > 0) ? trendData : [
    { name: 'Mei', Pemasukan: 0, Pengeluaran: 0 },
    { name: 'Jun', Pemasukan: 0, Pengeluaran: 0 },
    { name: 'Jul', Pemasukan: 0, Pengeluaran: 0 },
    { name: 'Agu', Pemasukan: 0, Pengeluaran: 0 },
    { name: 'Sep', Pemasukan: 0, Pengeluaran: 0 },
    { name: 'Okt', Pemasukan: 0, Pengeluaran: 0 },
  ];

  const budgetList = budgets || [];
  const totalBudgetLimit = budgetList.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalBudgetSpent = budgetList.reduce((s, b) => s + parseFloat(b.spent || 0), 0);
  const remainingBudgetLimit = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const budgetProgressPercent = totalBudgetLimit > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100)) : 0;

  const txList = recentTransactions || [];

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
            Dashboard
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Data tersimpan
          </div>


          {/* Notification Button */}
          <NotificationButton />

          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </div>

      <div className="page-content">
        {/* Signature Biru Dongker Hero Banner */}
        <div
          className="navy-banner"
          style={{
            borderRadius: 14,
            padding: '18px 24px',
            marginBottom: 14,
            alignItems: 'center',
            overflow: 'visible',
            position: 'relative',
            zIndex: 30,
          }}
        >
          <div className="navy-banner-left" style={{ flex: 1, position: 'relative', zIndex: 40 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 4, letterSpacing: '-0.3px' }}>
              {greeting}, {userName}
            </h1>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginBottom: 14, maxWidth: 440 }}>
              Lihat ke mana uangmu mengalir, dan apa yang bisa tumbuh.
            </p>

            {/* Date Pill Dropdown */}
            <div id="period-dropdown-wrapper" style={{ position: 'relative', display: 'inline-block', zIndex: 100 }}>
              <button
                type="button"
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 13px',
                  background: '#FFFFFF',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <Icon name="calendar_today" size={14} style={{ color: 'var(--primary)' }} />
                <span>{selectedPeriod}</span>
                <Icon name={showPeriodDropdown ? 'expand_less' : 'expand_more'} size={15} style={{ color: 'var(--primary)' }} />
              </button>

              {showPeriodDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    background: 'var(--bg-card)',
                    borderRadius: 14,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border)',
                    zIndex: 99999,
                    minWidth: 200,
                    padding: '6px 0',
                    overflow: 'hidden',
                  }}
                >
                  {dynamicPeriodOptions.map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => {
                        setSelectedPeriod(opt.label);
                        setSelectedPeriodOption(opt);
                        setShowPeriodDropdown(false);
                      }}
                      style={{
                        padding: '9px 16px',
                        fontSize: 12.5,
                        color: selectedPeriod === opt.label ? 'var(--primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: selectedPeriod === opt.label ? 700 : 500,
                        background: selectedPeriod === opt.label ? 'var(--primary-50)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'background 0.12s',
                      }}
                      onMouseOver={(e) => { if (selectedPeriod !== opt.label) e.currentTarget.style.background = 'var(--primary-50)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = selectedPeriod === opt.label ? 'var(--primary-50)' : 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {selectedPeriod === opt.label && <Icon name="check" size={14} color="var(--primary)" />}
                        <span>{opt.label}</span>
                      </div>
                      {opt.label === defaultPeriodName && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: '#DCFCE7', color: '#16A34A' }}>
                          Bulan ini
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="navy-banner-right">
            <div
              style={{
                background: '#FAF8F5',
                borderRadius: 14,
                padding: '12px 18px',
                minWidth: 240,
                textAlign: 'left',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #ECE7DE',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Saldo tersedia</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: '#DCFCE7', color: '#16A34A' }}>
                  Aktif
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                {formatRupiah(displayTotalBalance)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #ECE7DE', fontSize: 11, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="savings" size={13} style={{ color: '#2563EB' }} />
                  <span>Total Tabungan:</span>
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(displaySavings)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards Row - Perfectly Proportioned */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 16 }}>
          {/* 1. Pemasukan */}
          <div className="card" style={{ padding: '16px 18px', borderRadius: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="south_west" size={16} style={{ color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Pemasukan
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {incomeTxCount} tx
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: '10px 0 4px' }}>
              {formatRupiah(displayIncome)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Total pemasukan bulan ini
            </div>
          </div>

          {/* 2. Pengeluaran */}
          <div className="card" style={{ padding: '16px 18px', borderRadius: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="north_east" size={16} style={{ color: '#EF4444' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Pengeluaran
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {expenseRatio}% porsi
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: '10px 0 4px' }}>
              {formatRupiah(displayExpense)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {expenseCount} transaksi dicatat
            </div>
          </div>

          {/* 3. Rata-rata Pengeluaran */}
          <div className="card" style={{ padding: '16px 18px', borderRadius: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="query_stats" size={16} style={{ color: '#D97706' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Rata-rata Keluar
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                / hari
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: '10px 0 4px' }}>
              {formatRupiah(displayDailyAvg)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span>~{formatRupiah(displayAvgPerTx)}/tx</span>
              <span style={{ opacity: 0.85 }}>Hari ke-{currentDay}</span>
            </div>
          </div>

          {/* 4. Pengeluaran Terbesar */}
          <div className="card" style={{ padding: '16px 18px', borderRadius: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="local_fire_department" size={16} style={{ color: '#E11D48' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Pos Terbesar
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FECDD3',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {topExpenseCategory ? `${topExpenseCategory.percentage}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: '10px 0 4px' }}>
              {topExpenseCategory ? formatRupiah(topExpenseCategory.total_amount) : 'Rp0'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topExpenseTransaction ? `Transaksi terbesar: ${topExpenseTransaction.description} (${formatRupiah(topExpenseTransaction.amount)})` : ''}>
              {topExpenseCategory ? (
                <>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{topExpenseCategory.icon || '🏷️'} {topExpenseCategory.name}</span>
                  {topExpenseTransaction && (
                    <span style={{ color: 'var(--text-muted)' }}>· Tx: {topExpenseTransaction.description}</span>
                  )}
                </>
              ) : (
                'Belum ada transaksi keluar'
              )}
            </div>
          </div>
        </div>

        {/* Middle Section: 2 Columns Grid (~62% Arus Kas vs ~38% Ringkasan Anggaran) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Arus Kas Chart Card */}
          <div className="card" style={{ padding: '16px 18px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                Arus kas
              </h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Kumulatif bulan ini
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  {formatRupiah(surplus)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Surplus sebelum alokasi tabungan
                </div>
              </div>

              {/* Legend matching mockup */}
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />
                  Pemasukan
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C47D5A' }} />
                  Pengeluaran
                </span>
              </div>
            </div>

            {/* Line Chart */}
            <div style={{ width: '100%', height: 185 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9.5, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v === 0 ? 'Rp0' : `Rp${(v / 1000000).toFixed(0)} jt`)}
                    domain={[0, 16000000]}
                    ticks={[0, 5000000, 10000000, 15000000]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Pemasukan"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Pengeluaran"
                    stroke="#C47D5A"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ringkasan Anggaran & Pos Terbesar Card */}
          <div className="card" style={{ padding: '16px 18px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {rightWidgetTab === 'categories' ? 'Kategori Terbesar' : 'Ringkasan Anggaran'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#F1F5F9', padding: '3px', borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setRightWidgetTab('categories')}
                  style={{
                    border: 'none',
                    background: rightWidgetTab === 'categories' ? '#FFFFFF' : 'transparent',
                    color: rightWidgetTab === 'categories' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: rightWidgetTab === 'categories' ? 700 : 500,
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: rightWidgetTab === 'categories' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Kategori
                </button>
                <button
                  type="button"
                  onClick={() => setRightWidgetTab('budgets')}
                  style={{
                    border: 'none',
                    background: rightWidgetTab === 'budgets' ? '#FFFFFF' : 'transparent',
                    color: rightWidgetTab === 'budgets' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: rightWidgetTab === 'budgets' ? 700 : 500,
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: rightWidgetTab === 'budgets' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Anggaran
                </button>
              </div>
            </div>

            {rightWidgetTab === 'categories' ? (
              <>
                {/* Unified multi-color distribution bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      Distribusi Pengeluaran
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatRupiah(displayExpense)}
                    </span>
                  </div>
                  <div style={{ height: 7, background: '#F1F5F9', borderRadius: 999, display: 'flex', overflow: 'hidden', gap: 2 }}>
                    {(topExpenseCategories || []).length > 0 ? (
                      (topExpenseCategories || []).map((cat, i) => (
                        <div
                          key={cat.id || i}
                          title={`${cat.name}: ${cat.percentage}% (${formatRupiah(cat.total_amount)})`}
                          style={{
                            width: `${parseFloat(cat.percentage)}%`,
                            height: '100%',
                            background: cat.color || '#94A3B8',
                          }}
                        />
                      ))
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#E2E8F0' }} />
                    )}
                  </div>
                </div>

                {/* Clean, spacious category rows without thick underline stripes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(topExpenseCategories || []).length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      Belum ada transaksi pengeluaran bulan ini.
                    </div>
                  ) : (
                    (topExpenseCategories || []).slice(0, 4).map((cat, i) => {
                      const catColor = cat.color || '#64748B';
                      return (
                        <div
                          key={cat.id || i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: `${catColor}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                flexShrink: 0,
                              }}
                            >
                              {cat.icon || '🏷️'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cat.name}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span>{cat.count} tx</span>
                                <span>·</span>
                                <span style={{ fontWeight: 600, color: catColor }}>{cat.percentage}%</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                              {formatRupiah(cat.total_amount)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Subtle, cohesive bottom footer */}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, overflow: 'hidden' }}>
                    <span>🔥</span>
                    <span>Tertinggi:</span>
                    <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topExpenseTransaction ? `${topExpenseTransaction.description} (${formatRupiah(topExpenseTransaction.amount)})` : '-'}
                    </strong>
                  </div>
                  <Link
                    to="/transaksi"
                    style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 11, flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap' }}
                  >
                    Detail &rarr;
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    {formatRupiah(totalBudgetSpent)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {totalBudgetLimit > 0
                      ? `dari ${formatRupiah(totalBudgetLimit)} anggaran bulan ini`
                      : 'Belum ada anggaran yang diatur'}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 7, background: '#F1F3F5', borderRadius: 999, overflow: 'hidden', margin: '10px 0 14px' }}>
                  <div style={{ width: `${budgetProgressPercent}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
                </div>

                {/* Category Rows with Badges or Empty State */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {budgetList.length === 0 ? (
                    <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      Belum ada anggaran aktif bulan ini.
                      <div style={{ marginTop: 6 }}>
                        <Link to="/anggaran" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 11.5 }}>
                          + Buat anggaran baru
                        </Link>
                      </div>
                    </div>
                  ) : (
                    budgetList.slice(0, 4).map((b, i) => {
                      const spent = parseFloat(b.spent || 0);
                      const limit = parseFloat(b.amount || 0);
                      const isOver = spent > limit;
                      return (
                        <div key={b.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {b.category_name || b.name || 'Kategori'}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: isOver ? '#FDE8E8' : '#F4F5F7',
                              color: isOver ? '#DC2626' : 'var(--text-secondary)',
                            }}
                          >
                            {isOver ? 'Lewat anggaran' : `${formatRupiah(spent)} / ${formatRupiah(limit)}`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sisa Anggaran Footer */}
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Sisa anggaran: {formatRupiah(remainingBudgetLimit)}</span>
                  <Link to="/anggaran" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    Kelola &rarr;
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Section: Transaksi Terbaru Table Card */}
        <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              Transaksi terbaru
            </h3>
            <Link
              to="/transaksi"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Semua transaksi &rarr;
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 18, paddingTop: 8, paddingBottom: 8 }}>TRANSAKSI</th>
                  <th style={{ paddingTop: 8, paddingBottom: 8 }}>TANGGAL</th>
                  <th style={{ paddingTop: 8, paddingBottom: 8 }}>KATEGORI</th>
                  <th style={{ paddingTop: 8, paddingBottom: 8 }}>JENIS</th>
                  <th style={{ textAlign: 'right', paddingRight: 18, paddingTop: 8, paddingBottom: 8 }}>NOMINAL</th>
                </tr>
              </thead>
              <tbody>
                {txList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px 18px', color: 'var(--text-muted)', fontSize: 12.5 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#F4F5F7', marginBottom: 8 }}>
                        <Icon name="receipt_long" size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Belum ada transaksi</div>
                      <div>Mulai catat transaksi pertamamu untuk melacak pemasukan dan pengeluaran.</div>
                      <div style={{ marginTop: 8 }}>
                        <Link to="/transaksi" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>
                          + Tambah Transaksi
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  txList.slice(0, 5).map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx.id}>
                        <td style={{ paddingLeft: 18, paddingTop: 10, paddingBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name={tx.category_icon || (isIncome ? 'work' : 'shopping_bag')} size={17} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                              {tx.description}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 10, paddingBottom: 10 }}>
                          {formatDateShort(tx.date)}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 10, paddingBottom: 10 }}>
                          {tx.category_name}
                        </td>
                        <td style={{ paddingTop: 10, paddingBottom: 10 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: isIncome ? '#F0F9F4' : '#F5F5F7',
                              color: isIncome ? 'var(--income-color)' : 'var(--text-secondary)',
                            }}
                          >
                            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 18, paddingTop: 10, paddingBottom: 10 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: isIncome ? 'var(--income-color)' : 'var(--text-primary)',
                              display: 'block',
                            }}
                          >
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                          {parseFloat(tx.tax_amount || 0) > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#B45309',
                                background: '#FEF3C7',
                                padding: '1px 5px',
                                borderRadius: 4,
                                display: 'inline-block',
                                marginTop: 2,
                              }}
                              title={`Pokok: ${formatRupiah(parseFloat(tx.amount) - parseFloat(tx.tax_amount))} · Pajak/Fee: ${formatRupiah(tx.tax_amount)}`}
                            >
                              Pajak/Fee: +{formatRupiah(tx.tax_amount)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-muted)',
              background: '#FAFAFC',
            }}
          >
            <span>{txList.length > 0 ? `${Math.min(5, txList.length)} dari ${txList.length} transaksi di ${selectedPeriod}` : `0 transaksi di ${selectedPeriod}`}</span>
            <span style={{ cursor: 'pointer' }}>Semua rekening</span>
          </div>
        </div>

        {/* Bottom Callout Banner */}
        <div className="insight-banner">
          <Icon name="spa" size={18} style={{ color: '#5C4A34' }} />
          <span>
            {displayIncome === 0 && displayExpense === 0
              ? 'Selamat datang! Catat transaksi atau tambahkan dompet pertamamu untuk memulai pelacakan keuangan.'
              : surplus >= 0
                ? `Keuanganmu terkelola dengan baik! Surplus ${selectedPeriod} adalah ${formatRupiah(surplus)}.`
                : `Pengeluaranmu melebihi pemasukan sebesar ${formatRupiah(Math.abs(surplus))} di ${selectedPeriod}. Pantau kembali pos pengeluaranmu.`}
          </span>
        </div>
      </div>
    </>
  );
}
