import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardBottomNav from '../components/DashboardBottomNav';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  Plus,
  Utensils,
  ShoppingBag,
  Receipt,
  Car,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Custom Tooltip for Recharts Cashflow Bar Chart
const CashflowTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#181B30] border border-[#DFE5EE] dark:border-gray-700 rounded-xl p-3 shadow-xl text-xs font-sans">
        <p className="font-extrabold text-[#191B3D] dark:text-white mb-2">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#61647C] dark:text-slate-300 font-medium">
                {item.name}:
              </span>
            </div>
            <span className="font-bold text-[#191B3D] dark:text-white">
              {formatRupiah(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Helper for Category Icons using lucide-react
const getCategoryIconComponent = (categoryName) => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('makan') || name.includes('minum') || name.includes('food')) {
    return Utensils;
  }
  if (name.includes('belanja') || name.includes('shop')) {
    return ShoppingBag;
  }
  if (name.includes('tagihan') || name.includes('listrik') || name.includes('air')) {
    return Receipt;
  }
  if (name.includes('transport') || name.includes('bensin') || name.includes('kendaraan')) {
    return Car;
  }
  if (name.includes('gaji') || name.includes('rekening') || name.includes('bank')) {
    return CreditCard;
  }
  return Layers;
};

// Format short date in Indonesian (e.g. 19 Okt)
const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return dateStr;
  }
};

/**
 * Dashboard Component
 * Supports:
 * - Standalone mode (standalone = true): includes its own DashboardSidebar and DashboardBottomNav
 * - Layout embedded mode (standalone = false, default): fits seamlessly inside App Layout
 */
export default function Dashboard({ standalone = false }) {
  const { user, authFetch } = useAuth();
  const { maskAmount } = usePrivacy();
  const navigate = useNavigate();
  const [_loading, setLoading] = useState(true);

  // Initial dummy state matching FigCraft MCP tokens
  const [data, setData] = useState({
    totalBalance: 654790,
    monthlyIncome: 1101200,
    monthlyExpense: 462002,
    totalSavings: 639198,
    dailyAvgExpense: 21000,
    topExpenseCategories: [
      { id: 1, name: 'Lain-lain', percentage: '33,31', total_amount: 153900, color: '#059669' },
      { id: 2, name: 'Makanan & Minuman', percentage: '31,71', total_amount: 146502, color: '#4F46E5' },
      { id: 3, name: 'Belanja', percentage: '26,75', total_amount: 123600, color: '#F59E0B' },
    ],
    trendData: [
      { month: 'Jan', income: 950000, expense: 420000 },
      { month: 'Feb', income: 800000, expense: 500000 },
      { month: 'Mar', income: 1050000, expense: 600000 },
      { month: 'Apr', income: 900000, expense: 480000 },
      { month: 'Mei', income: 1200000, expense: 700000 },
      { month: 'Jun', income: 850000, expense: 530000 },
      { month: 'Jul', income: 1100000, expense: 620000 },
      { month: 'Agt', income: 980000, expense: 490000 },
      { month: 'Sep', income: 1150000, expense: 580000 },
      { month: 'Okt', income: 1101200, expense: 462002 },
    ],
    recentTransactions: [
      { id: 1, description: 'Mixue Ice Cream', category_name: 'Makanan & Minuman', wallet_name: 'Gopay', date: '2026-10-19', amount: 39000, type: 'expense' },
      { id: 2, description: 'Sarapan Pagi', category_name: 'Makanan & Minuman', wallet_name: 'Rekening Utama', date: '2026-10-19', amount: 15000, type: 'expense' },
      { id: 3, description: 'Parfume Original', category_name: 'Belanja', wallet_name: 'Rekening Utama', date: '2026-10-19', amount: 123600, type: 'expense' },
      { id: 4, description: 'Freelance Design', category_name: 'Gaji', wallet_name: 'Rekening Utama', date: '2026-10-18', amount: 750000, type: 'income' },
    ],
  });

  const INDONESIAN_MONTHS = useMemo(
    () => [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ],
    []
  );

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const defaultPeriodName = `${INDONESIAN_MONTHS[currentMonthIdx]} ${currentYear}`;

  const periodOptions = useMemo(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      list.push({
        label: `${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
    }
    list.push({ label: `Tahun ${currentYear}`, month: null, year: currentYear });
    return list;
  }, [currentMonthIdx, currentYear, INDONESIAN_MONTHS]);

  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriodName);
  const [selectedPeriodOption, setSelectedPeriodOption] = useState(() => ({
    label: defaultPeriodName,
    month: currentMonthIdx + 1,
    year: currentYear,
  }));
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#dashboard-period-dropdown')) {
        setShowPeriodDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch summary from API
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!authFetch) return;
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
          setData((prev) => ({
            ...prev,
            ...json,
            trendData: json.trendData && json.trendData.length > 0 ? json.trendData : prev.trendData,
            recentTransactions: json.recentTransactions && json.recentTransactions.length > 0 ? json.recentTransactions : prev.recentTransactions,
          }));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authFetch, selectedPeriodOption]);

  const userName = user?.name ? user.name.split(' ')[0] : 'Muhammad';
  const hour = new Date().getHours();
  let greeting = 'Selamat Datang';
  if (hour >= 4 && hour < 11) greeting = 'Selamat Pagi';
  else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else greeting = 'Selamat Malam';

  const {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    totalSavings,
    topExpenseCategories,
    trendData,
    recentTransactions,
  } = data;

  const netCashflow = monthlyIncome - monthlyExpense;

  // Main Dashboard Content JSX
  const mainContent = (
    <div className="w-full min-h-screen bg-[#F2F3F8] dark:bg-[#0d0f18] text-[#191B3D] dark:text-slate-100 font-sans antialiased transition-colors duration-150 flex flex-col">
      {/* ======================================================================= */}
      {/* TOPBAR (DESKTOP & TABLET: md+)                                          */}
      {/* ======================================================================= */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-[68px] bg-white dark:bg-[#141721] border-b border-[#DFE5EE] dark:border-gray-800 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#7F8A9E] dark:text-slate-400">
          <span>Ruang personal</span>
          <span>·</span>
          <span className="font-semibold text-[#191B3D] dark:text-white">Dasbor</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Data tersimpan
          </div>
          <ThemeToggleBtn />
          <NotificationButton />
          <span className="text-xs text-[#191B3D] dark:text-slate-300 font-medium">
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </header>

      {/* ======================================================================= */}
      {/* MAIN CONTAINER                                                          */}
      {/* ======================================================================= */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 md:pt-7 pb-24 md:pb-12 max-w-7xl w-full mx-auto space-y-6">
        {/* Mobile Subheader Breadcrumb & Date */}
        <div className="md:hidden flex items-center justify-between text-[11px] text-[#61647C] dark:text-slate-400 px-0.5">
          <span>Ruang personal · Dasbor</span>
          <span>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        {/* ===================================================================== */}
        {/* ROW 1: HEADER BANNER (8 COLS) + KARTU SALDO UTAMA (4 COLS)            */}
        {/* ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Banner Header: Sapaan & Filter Periode */}
          <div className="lg:col-span-8 bg-gradient-to-br from-[#ECEEF8] via-[#E6E9F5] to-[#DFE3F2] dark:from-[#181B30] dark:via-[#15172A] dark:to-[#101222] border border-[#D4DAEB] dark:border-indigo-950/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs space-y-5 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" aria-hidden="true" />

            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-600/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300 border border-indigo-600/15">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Pusat Keuangan Pribadi</span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#191B3D] dark:text-white tracking-tight">
                {greeting}, {userName}!
              </h1>
              <p className="text-xs md:text-sm text-[#61647C] dark:text-slate-300 leading-relaxed max-w-xl">
                Pantau ke mana uangmu mengalir, jaga kestabilan anggaran, dan lihat apa yang bisa terus tumbuh.
              </p>
            </div>

            {/* Filter Periode & Action Button */}
            <div className="flex items-center gap-3 flex-wrap pt-2 relative z-10">
              {/* Dropdown Periode */}
              <div id="dashboard-period-dropdown" className="relative">
                <button
                  type="button"
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-[#D4DAEB] dark:border-gray-700 text-xs font-bold text-[#191B3D] dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{selectedPeriod}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showPeriodDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 w-52 bg-white dark:bg-[#181B30] border border-[#DFE5EE] dark:border-gray-700 rounded-xl shadow-xl p-1.5 z-40 animate-fade-in">
                    {periodOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(opt.label);
                          setSelectedPeriodOption(opt);
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          selectedPeriod === opt.label
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                            : 'text-[#61647C] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Transaction Action Button */}
              <Link
                to="/transaksi"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#17193F] to-[#25285E] hover:from-[#1F2250] hover:to-[#2D3070] dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-500 dark:hover:to-indigo-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Transaksi</span>
              </Link>
            </div>
          </div>

          {/* Right Card: Kartu Saldo Utama (Gradasi Ungu Gelap) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 via-[#191B3D] to-indigo-950 text-white rounded-2xl p-6 sm:p-7 border border-indigo-800/40 shadow-md relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="pointer-events-none absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl" aria-hidden="true" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-indigo-200/90 uppercase">
                TOTAL SALDO BERSIH
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Personal Aktif
              </span>
            </div>

            <div className="relative z-10 my-1">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {maskAmount(formatRupiah(totalBalance))}
              </div>
              <p className="text-xs text-indigo-200/80 mt-1">
                Saldo Tersedia di Seluruh Rekening &amp; E-Wallet
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 relative z-10 flex items-center justify-between text-xs">
              <span className="text-indigo-200/90 font-medium">
                Tabungan: {maskAmount(formatRupiah(totalSavings))}
              </span>
              <Link
                to="/dompet"
                className="text-white hover:text-indigo-200 font-bold flex items-center gap-1 group transition-colors"
              >
                <span>Kelola Dompet</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* ROW 2: 3 KARTU STATISTIK KECIL DI TENGAH                              */}
        {/* ===================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Pemasukan */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 min-h-[145px] flex flex-col justify-center gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                TOTAL PEMASUKAN
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {maskAmount(formatRupiah(monthlyIncome))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+12.4%</span>
              <span>dibandingkan bulan lalu</span>
            </div>
          </div>

          {/* Card 2: Total Pengeluaran */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 min-h-[145px] flex flex-col justify-center gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                TOTAL PENGELUARAN
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {maskAmount(formatRupiah(monthlyExpense))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">41.9%</span>
              <span>dari total pemasukan bulan ini</span>
            </div>
          </div>

          {/* Card 3: Arus Kas Bersih */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 min-h-[145px] flex flex-col justify-center gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                ARUS KAS BERSIH
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {netCashflow >= 0 ? '+' : ''}{maskAmount(formatRupiah(netCashflow))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Surplus tabungan aman</span>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* ROW 3: SECTION ANALISIS (2 KOLOM PROPORSIONAL 2:1)                    */}
        {/* ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Kolom Kiri (8 Cols): Grafik Arus Kas Recharts */}
          <div className="lg:col-span-8 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                  Arus Kas Bulanan
                </h2>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                  Perbandingan pemasukan &amp; pengeluaran sepanjang tahun
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-[#191B3D] dark:text-slate-200">
                  <span className="w-3 h-3 rounded-md bg-[#059669]" />
                  <span>Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#191B3D] dark:text-slate-200">
                  <span className="w-3 h-3 rounded-md bg-[#4F46E5]" />
                  <span>Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full h-64 pt-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tick={{ fill: '#7F8A9E', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                    tick={{ fill: '#7F8A9E', fontSize: 11 }}
                  />
                  <Tooltip content={<CashflowTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Kolom Kanan (4 Cols): Kategori Pengeluaran Terbesar */}
          <div className="lg:col-span-4 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                  Kategori Terbesar
                </h2>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {formatRupiah(monthlyExpense)}
                </span>
              </div>
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                Alokasi pengeluaran utama bulan ini
              </p>
            </div>

            {/* Stacked Multi-color Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-gray-800 flex overflow-hidden">
              <div style={{ width: '33.31%' }} className="bg-[#059669]" title="Lain-lain: 33.31%" />
              <div style={{ width: '31.71%' }} className="bg-[#4F46E5]" title="Makanan: 31.71%" />
              <div style={{ width: '26.75%' }} className="bg-[#F59E0B]" title="Belanja: 26.75%" />
              <div style={{ width: '8.23%' }} className="bg-slate-300 dark:bg-slate-600" title="Lainnya" />
            </div>

            {/* Category List */}
            <div className="space-y-3.5 text-xs">
              {topExpenseCategories.map((cat, idx) => {
                const IconComp = getCategoryIconComponent(cat.name);
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-[#191B3D] dark:text-white">
                          {cat.name}
                        </div>
                        <div className="text-[11px] text-[#7F8A9E] dark:text-slate-400">
                          {cat.percentage}% dari total
                        </div>
                      </div>
                    </div>
                    <div className="font-extrabold text-[#191B3D] dark:text-white">
                      {maskAmount(formatRupiah(cat.total_amount))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              to="/laporan"
              className="pt-3 border-t border-slate-100 dark:border-gray-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center justify-between group transition-colors"
            >
              <span>Lihat Detail Laporan Kategori</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* ROW 4: RIWAYAT TRANSAKSI TERBARU                                      */}
        {/* ===================================================================== */}
        <section className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                Transaksi Terbaru
              </h2>
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                Catatan keuangan yang baru saja Anda lakukan
              </p>
            </div>

            <Link
              to="/transaksi"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 group transition-colors"
            >
              <span>Lihat Semua Transaksi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* List of Recent Transactions */}
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {recentTransactions.map((tx) => {
              const IconComp = getCategoryIconComponent(tx.category_name);
              const isExpense = tx.type === 'expense';
              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-gray-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isExpense
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-extrabold text-xs sm:text-sm text-[#191B3D] dark:text-white truncate">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-[#7F8A9E] dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{tx.category_name || 'Lainnya'}</span>
                        <span>•</span>
                        <span>{tx.wallet_name || 'Dompet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-extrabold text-xs sm:text-sm ${
                        isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '- ' : '+ '}
                      {maskAmount(formatRupiah(tx.amount))}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatShortDate(tx.date)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );

  // If standalone is true, mount self-contained with responsive DashboardSidebar and DashboardBottomNav
  if (standalone) {
    return (
      <div className="flex min-h-screen bg-[#F2F3F8] dark:bg-[#0d0f18]">
        <DashboardSidebar userName={userName} />
        <div className="flex-1 md:pl-20 lg:pl-64 flex flex-col min-w-0">
          {mainContent}
        </div>
        <DashboardBottomNav />
      </div>
    );
  }

  // Otherwise, render mainContent directly into the App's Layout
  return mainContent;
}
