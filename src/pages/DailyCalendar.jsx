import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function DailyCalendar() {
  const { authFetch } = useAuth();
  const { maskAmount } = usePrivacy();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedWallet, setSelectedWallet] = useState('');

  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  // Load data for the selected month
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const monthNum = currentMonth + 1;
        const [txRes, walRes, sumRes] = await Promise.all([
          authFetch(`/api/transactions?month=${monthNum}&year=${currentYear}&limit=500`),
          authFetch('/api/wallets'),
          authFetch(`/api/dashboard/summary?month=${monthNum}&year=${currentYear}`),
        ]);

        if (txRes.ok) setTransactions(await txRes.json());
        if (walRes.ok) setWallets(await walRes.json());
        if (sumRes.ok) {
          const s = await sumRes.json();
          setSummary({
            income: s.monthlyIncome || 0,
            expense: s.monthlyExpense || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load daily calendar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentMonth, currentYear]);

  // Filter transactions by wallet if selected
  const filteredTransactions = useMemo(() => {
    if (!selectedWallet) return transactions;
    return transactions.filter((t) => String(t.wallet_id) === String(selectedWallet));
  }, [transactions, selectedWallet]);

  // Aggregate daily expenses map: { dayNumber: { totalExpense, count, transactions: [] } }
  const dailyMap = useMemo(() => {
    const map = {};
    filteredTransactions.forEach((tx) => {
      if (!tx.date) return;
      const d = new Date(tx.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        if (!map[day]) map[day] = { totalExpense: 0, count: 0, items: [] };
        if (tx.type === 'expense') {
          map[day].totalExpense += parseFloat(tx.amount) || 0;
        }
        map[day].count += 1;
        map[day].items.push(tx);
      }
    });
    return map;
  }, [filteredTransactions, currentMonth, currentYear]);

  // Calendar cells generation (Monday to Sunday)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // In JS getDay(): Sunday is 0, Monday is 1... We want Monday = 0, Sunday = 6
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];
    // Previous month filler days
    for (let i = offset - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({ day: d, isCurrentMonth: true });
    }
    // Next month filler days to complete grid to multiple of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      cells.push({ day: j, isCurrentMonth: false });
    }
    return cells;
  }, [currentYear, currentMonth]);

  // Transactions for selected day
  const selectedDayData = dailyMap[selectedDay] || { totalExpense: 0, count: 0, items: [] };
  const selectedDateObj = new Date(currentYear, currentMonth, selectedDay);
  const selectedDateFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDateObj);

  // Category breakdown for selected day
  const selectedDayCategories = useMemo(() => {
    const cats = {};
    selectedDayData.items
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name = t.category_name || 'Lainnya';
        cats[name] = (cats[name] || 0) + (parseFloat(t.amount) || 0);
      });
    return Object.entries(cats).map(([name, total]) => ({ name, total }));
  }, [selectedDayData]);

  const uniqueWalletsCount = useMemo(() => {
    const set = new Set(selectedDayData.items.map((i) => i.wallet_id));
    return set.size;
  }, [selectedDayData]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const cashFlowDiff = summary.income - summary.expense;

  return (
    <>
      {/* Topbar — standard pattern */}
      <header className="topbar dashboard-topbar">
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Ruang personal</span>
          <span style={{ color: 'var(--text-muted, #94A3B8)' }}>·</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>Kalender Harian</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Data tersimpan
          </div>
          <NotificationButton />
          <ThemeToggleBtn />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary, #64748B)', fontWeight: 500 }}>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </header>

      <div className="mm-page-container">
      {/* Title & Actions Row */}
      <div className="mm-page-title-row">
        <div>
          <h1 className="mm-page-title">Kalender Rekap Harian</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, margin: 0 }}>
            Pantau arus uangmu, satu hari dalam satu tampilan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="mm-btn-white"
            onClick={() => window.print()}
          >
            <Download size={14} />
            <span>Unduh rekap</span>
          </button>
          <Link to="/transaksi" className="mm-btn-navy">
            <Plus size={15} />
            <span>+ Catat transaksi</span>
          </Link>
        </div>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="mm-stat-grid-3">
        {/* Pemasukan bulan ini */}
        <div className="mm-stat-card mm-stat-card-lavender">
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
            Pemasukan bulan ini
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: '8px 0 2px' }}>
            {maskAmount(formatRupiah(summary.income))}
          </div>
          <span style={{ fontSize: 11.5, color: '#64748B' }}>
            {INDONESIAN_MONTHS[currentMonth]} {currentYear}
          </span>
        </div>

        {/* Pengeluaran bulan ini */}
        <div className="mm-stat-card">
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
            Pengeluaran bulan ini
          </span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: '8px 0 2px' }}>
            {maskAmount(formatRupiah(summary.expense))}
          </div>
          <span style={{ fontSize: 11.5, color: '#64748B' }}>Termasuk transaksi tercatat</span>
        </div>

        {/* Selisih arus kas */}
        <div className="mm-hero-navy" style={{ padding: '18px 22px', borderRadius: 18, minHeight: 108 }}>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
            Selisih arus kas
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.4px', margin: '6px 0 2px' }}>
            {cashFlowDiff >= 0 ? '+ ' : ''}{maskAmount(formatRupiah(cashFlowDiff))}
          </div>
          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Pemasukan – pengeluaran</span>
        </div>
      </div>

      {/* Main 2 Columns: Calendar Grid vs Rekap Harian */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        {/* Calendar Card */}
        <div className="mm-card">
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                {INDONESIAN_MONTHS[currentMonth]} {currentYear}
              </span>
              <div style={{ display: 'inline-flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  style={{ width: 28, height: 28, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  style={{ width: 28, height: 28, borderRadius: 8, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="mm-btn-white"
                  style={{ appearance: 'none', paddingRight: 26, fontSize: 12.5, padding: '7px 26px 7px 12px' }}
                >
                  <option value="">Semua dompet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
              </div>

              <button
                type="button"
                className="mm-btn-white"
                onClick={goToToday}
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                Hari ini
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: '8px 4px', marginBottom: 6, textAlign: 'center' }}>
            {WEEKDAYS.map((w, idx) => (
              <span key={idx} style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {calendarCells.map((cell, idx) => {
              const dayData = cell.isCurrentMonth ? dailyMap[cell.day] : null;
              const hasExpense = dayData && dayData.totalExpense > 0;
              const isSelected = cell.isCurrentMonth && cell.day === selectedDay;
              const todayFlag = cell.isCurrentMonth && isToday(cell.day);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (cell.isCurrentMonth) setSelectedDay(cell.day);
                  }}
                  style={{
                    height: 64,
                    padding: 6,
                    borderRadius: 10,
                    cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                    opacity: cell.isCurrentMonth ? 1 : 0.35,
                    background: isSelected ? '#101626' : '#FFFFFF',
                    border: todayFlag && !isSelected ? '2px solid #0F172A' : isSelected ? 'none' : '1px solid #EEF2F6',
                    color: isSelected ? '#FFFFFF' : '#0F172A',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    {cell.day}
                  </div>

                  <div style={{ textAlign: 'center', fontSize: 10.5 }}>
                    {hasExpense ? (
                      <div>
                        <div style={{ fontWeight: 800, color: isSelected ? '#FFFFFF' : '#0F172A' }}>
                          -{formatRupiah(dayData.totalExpense).replace('Rp ', '')}
                        </div>
                        <div style={{ fontSize: 9.5, opacity: 0.7 }}>
                          {dayData.count} transaksi
                        </div>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div style={{ display: 'flex', gap: 18, marginTop: 16, paddingTop: 12, borderTop: '1px solid #EEF2F6', fontSize: 11.5, color: '#64748B', flexWrap: 'wrap' }}>
            <span>■ {selectedDay} • Tanggal dipilih</span>
            <span>▢ {today.getDate()} • Hari ini</span>
            <span>Nominal = total pengeluaran harian</span>
          </div>
        </div>

        {/* Right Column: REKAP HARIAN */}
        <div className="mm-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
              REKAP HARIAN
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
              {selectedDateFormatted}
            </h2>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
              {selectedDayData.count} transaksi · {uniqueWalletsCount} dompet
            </div>

            {/* Pengeluaran tercatat box */}
            <div style={{ background: '#EAEFF8', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Pengeluaran tercatat</span>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
                {maskAmount(formatRupiah(selectedDayData.totalExpense))}
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Dari {selectedDayData.count} transaksi yang ditampilkan
              </span>
            </div>

            {/* Rincian Transaksi */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                Rincian transaksi
              </div>

              {selectedDayData.items.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94A3B8', padding: '12px 0' }}>
                  Tidak ada transaksi pada tanggal ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDayData.items.map((tx) => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {tx.description || tx.category_name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          {tx.category_name} · {tx.wallet_name}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tx.type === 'income' ? '#059669' : '#0F172A' }}>
                        {tx.type === 'income' ? '+ ' : '- '}
                        {maskAmount(formatRupiah(tx.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kategori Hari Ini */}
            {selectedDayCategories.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                  Kategori hari ini
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedDayCategories.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569' }}>
                      <span>{c.name}</span>
                      <strong style={{ color: '#0F172A' }}>{formatRupiah(c.total)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/transaksi"
            className="mm-btn-white"
            style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
          >
            Lihat semua transaksi
          </Link>
        </div>
      </div>

      {/* Bottom Notice Banner */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8ECF2', padding: '14px 18px', fontSize: 12, color: '#64748B' }}>
        <strong>Tentang rekap ini</strong>: Ringkasan bulanan mengikuti data dasbor. Rincian kalender menampilkan transaksi yang tercatat pada rentang tanggal bulan aktif.
      </div>
      </div>
    </>
  );
}
