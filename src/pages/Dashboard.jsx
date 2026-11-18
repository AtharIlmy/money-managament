import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#DFE5EE] rounded-2xl p-3 shadow-lg text-xs font-sans">
        <p className="font-bold text-[#191B3D] mb-1.5">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-[#61647C]">{p.name}: </span>
            <span className="font-bold text-[#191B3D]">{formatRupiah(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const getCategoryIcon = (categoryName) => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('makan') || name.includes('minum') || name.includes('food')) return 'restaurant';
  if (name.includes('belanja') || name.includes('shop')) return 'shopping_bag';
  if (name.includes('tagihan') || name.includes('listrik') || name.includes('air')) return 'receipt_long';
  if (name.includes('transport') || name.includes('bensin')) return 'directions_car';
  if (name.includes('gaji') || name.includes('bonus')) return 'payments';
  if (name.includes('lain')) return 'layers';
  return 'layers';
};

const formatTxDateShort = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return dateStr;
  }
};

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const { isHidden: _isHidden, maskAmount: _maskAmount } = usePrivacy();
  const [_loading, setLoading] = useState(true);

  const [data, setData] = useState({
    totalBalance: 654790,
    monthlyIncome: 1101200,
    monthlyExpense: 462002,
    totalSavings: 639198,
    dailyAvgExpense: 21000,
    avgPerTransaction: 0,
    expenseTxCount: 0,
    daysElapsed: 22,
    topExpenseCategory: { name: 'Lainnya', percentage: '33,31', total_amount: 153900, count: 1 },
    topExpenseCategories: [
      { id: 1, name: 'Lain-lain', percentage: '33,31', total_amount: 153900 },
      { id: 2, name: 'Makanan & Minuman', percentage: '31,71', total_amount: 146502 },
      { id: 3, name: 'Belanja', percentage: '26,75', total_amount: 123600 },
    ],
    topExpenseTransaction: null,
    trendData: [],
    recentTransactions: [
      { id: 1, description: 'Mixue', category_name: 'Makanan & Minuman', wallet_name: 'Gopay', date: '2026-10-19', amount: 39000, type: 'expense' },
      { id: 2, description: 'Sarapan', category_name: 'Makanan & Minuman', wallet_name: 'Rekening Utama', date: '2026-10-19', amount: 15000, type: 'expense' },
      { id: 3, description: 'Parfume', category_name: 'Belanja', wallet_name: 'Rekening Utama', date: '2026-10-19', amount: 123600, type: 'expense' },
    ],
    budgets: [],
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

  const dynamicPeriodOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      options.push({
        label: `${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
    }
    options.push({ label: `Tahun ${currentYear}`, month: null, year: currentYear });
    return options;
  }, [currentMonthIdx, currentYear, INDONESIAN_MONTHS]);

  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriodName);
  const [selectedPeriodOption, setSelectedPeriodOption] = useState(() => ({
    label: defaultPeriodName,
    month: currentMonthIdx + 1,
    year: currentYear,
  }));
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [categoryType, setCategoryType] = useState('Pengeluaran');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Kategori');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCategoryTypeDropdown, setShowCategoryTypeDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#period-dropdown-wrapper')) setShowPeriodDropdown(false);
      if (!e.target.closest('#cat-filter-dropdown-wrapper')) setShowCategoryDropdown(false);
      if (!e.target.closest('#cat-type-dropdown-wrapper')) setShowCategoryTypeDropdown(false);
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
          setData((prev) => ({ ...prev, ...json }));
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodOption]);

  const {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    dailyAvgExpense,
    daysElapsed,
    topExpenseCategory,
    topExpenseCategories,
    recentTransactions,
  } = data;

  const userName = user?.name ? user.name.split(' ')[0] : 'Muhammad';
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? 'Selamat pagi'
      : hour < 15
      ? 'Selamat siang'
      : hour < 18
      ? 'Selamat sore'
      : 'Selamat malam';

  const displayTotalBalance = parseFloat(totalBalance || 0);
  const displayIncome = parseFloat(monthlyIncome || 0);
  const displayExpense = parseFloat(monthlyExpense || 0);
  const surplus = displayIncome - displayExpense;

  const currentDay = daysElapsed || Math.max(1, new Date().getDate());
  const displayDailyAvg =
    dailyAvgExpense !== undefined
      ? parseFloat(dailyAvgExpense || 0)
      : displayExpense > 0
      ? Math.round(displayExpense / currentDay)
      : 0;

  const expenseRatio =
    displayIncome > 0
      ? ((displayExpense / displayIncome) * 100).toFixed(2).replace('.', ',')
      : displayExpense > 0
      ? '100'
      : '0';

  const cashFlowChartData = [
    {
      name: selectedPeriod.split(' ')[0].slice(0, 3),
      Pemasukan: displayIncome,
      Pengeluaran: displayExpense,
    },
  ];

  const txList = recentTransactions || [];
  const isExpenseType = categoryType === 'Pengeluaran';
  const displayedCategories = isExpenseType ? (topExpenseCategories || []).slice(0, 3) : [];
  const otherCategories = isExpenseType ? (topExpenseCategories || []).slice(3) : [];
  const otherAmount = otherCategories.reduce(
    (s, c) => s + (parseFloat(c.total_amount) || 0),
    0
  );
  const totalAmountToShow = isExpenseType ? displayExpense : displayIncome;

  return (
    <div className="w-full min-h-screen bg-[#F2F3F8] dark:bg-[#0A0B14] font-sans antialiased text-[#191B3D] dark:text-slate-100 flex flex-col">
      {/* ======================================================== */}
      {/* DESKTOP / TABLET TOPBAR (Hidden on mobile < md)          */}
      {/* ======================================================== */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-16 bg-white dark:bg-[#13192B] border-b border-[#DFE5EE] dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 text-xs lg:text-sm text-[#61647C] dark:text-slate-400">
          <span>Ruang personal</span>
          <span>·</span>
          <span className="font-semibold text-[#191B3D] dark:text-white">Dasbor</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Data tersimpan
          </div>
          <ThemeToggleBtn />
          <NotificationButton />
          <span className="text-xs text-[#61647C] dark:text-slate-400 font-medium">
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTENT CONTAINER (MOBILE FIRST: 390px default)    */}
      {/* ======================================================== */}
      <div className="flex-1 px-5 md:px-7 lg:px-8 pt-3 md:pt-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto space-y-4 md:space-y-5">
        {/* Mobile Subheader: Periode Halaman (Figma 1:2503) */}
        <div className="md:hidden flex items-center justify-between text-[11px] text-[#61647C] dark:text-slate-400 leading-normal px-0.5">
          <span>Ruang personal · Dasbor</span>
          <span>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        {/* Judul Halaman: Dasbor (Figma 1:2507) */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#191B3D] dark:text-white tracking-[-0.8px] leading-tight">
          Dasbor
        </h1>

        {/* ======================================================== */}
        {/* BENTO ROW 1: HERO GREETING + SALDO BOX (Figma 1:2509)     */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-4 items-stretch">
          {/* Card Sapaan Lavender (Figma 1:2510) */}
          <div className="md:col-span-7 lg:col-span-8 bg-[#E7E7F4] dark:bg-[#1C2035] rounded-3xl p-5 md:p-6 lg:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <h2 className="text-[23px] font-bold text-[#191B3D] dark:text-white tracking-[-0.7px] leading-[125%]">
                {greeting}, {userName}
              </h2>
              <p className="text-[13px] text-[#61647C] dark:text-slate-400 leading-[145%] mt-1.5 mb-4">
                Lihat ke mana uangmu mengalir, dan apa yang bisa tumbuh.
              </p>
            </div>

            {/* Pilihan Filter Dropdown (Figma 1:2514) */}
            <div id="period-dropdown-wrapper" className="relative inline-block self-start">
              <button
                type="button"
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="h-10 px-3.5 rounded-[10px] bg-white dark:bg-[#252A42] border border-[#DFE5EE] dark:border-slate-700 text-[12px] font-medium text-[#191B3D] dark:text-white flex items-center gap-3 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span>{selectedPeriod}</span>
                <Icon name={showPeriodDropdown ? 'expand_less' : 'expand_more'} size={15} style={{ color: '#61647C' }} />
              </button>

              {showPeriodDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1C2035] border border-[#DFE5EE] dark:border-slate-700 rounded-2xl shadow-xl p-1.5 z-30">
                  {dynamicPeriodOptions.map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => {
                        setSelectedPeriod(opt.label);
                        setSelectedPeriodOption(opt);
                        setShowPeriodDropdown(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors ${
                        selectedPeriod === opt.label
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedPeriod === opt.label && <Icon name="check" size={14} color="var(--primary)" />}
                        <span>{opt.label}</span>
                      </div>
                      {opt.label === defaultPeriodName && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Bulan ini
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Saldo Midnight (Figma 1:2518) */}
          <div className="md:col-span-5 lg:col-span-4 bg-[#191B3D] rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-xs min-h-[143px]">
            {/* Progressive Blur Glow Ellipse */}
            <div
              className="absolute -right-12 -top-6 w-[280px] h-[160px] rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <span className="text-[12px] text-white/90 leading-[145%]">
                Saldo tersedia
              </span>
              <div className="text-[34px] font-bold text-white tracking-[-0.7px] leading-[145%] my-1">
                {formatRupiah(displayTotalBalance)}
              </div>
              <span className="text-[12px] text-white/80 leading-[145%]">
                Total saldo dompet · Aktif
              </span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BENTO ROW 2: 4 STAT CARDS (2x2 on Mobile, Figma 1:2522)   */}
        {/* ======================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Pemasukan (Figma 1:2523) */}
          <div className="bg-[#E7E7F4] dark:bg-[#1C2035] rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[11px] text-[#61647C] dark:text-slate-400 font-normal leading-[145%]">
                Pemasukan
              </span>
              <svg className="w-[15px] h-[15px] text-[#191B3D] dark:text-white" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M10.625 4.375L4.375 10.625M4.375 10.625H9.687M4.375 10.625V5.313" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] font-bold text-[#22755F] leading-none">
                11%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-[19px] font-bold text-[#191B3D] dark:text-white tracking-tight leading-tight">
                {formatRupiah(displayIncome)}
              </div>
              <div className="text-[11px] text-[#61647C] dark:text-slate-400 leading-snug mt-1">
                Total pemasukan bulan ini
              </div>
            </div>
          </div>

          {/* Card 2: Pengeluaran (Figma 1:2531) */}
          <div className="bg-white dark:bg-[#13192B] border border-[#DFE5EE] dark:border-slate-800 rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[11px] text-[#61647C] dark:text-slate-400 font-normal leading-[145%]">
                Pengeluaran
              </span>
              <svg className="w-[15px] h-[15px] text-[#61647C] dark:text-slate-400" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4.375 10.625L10.625 4.375M10.625 4.375H5.313M10.625 4.375V9.687" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] font-bold text-[#22755F] leading-none">
                {expenseRatio}%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-[19px] font-bold text-[#191B3D] dark:text-white tracking-tight leading-tight">
                {formatRupiah(displayExpense)}
              </div>
              <div className="text-[11px] text-[#61647C] dark:text-slate-400 leading-snug mt-1">
                Total pengeluaran bulan ini
              </div>
            </div>
          </div>

          {/* Card 3: Rata-rata Keluar (Figma 1:2539) */}
          <div className="bg-white dark:bg-[#13192B] border border-[#DFE5EE] dark:border-slate-800 rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[11px] text-[#61647C] dark:text-slate-400 font-normal leading-[145%]">
                Rata-rata Keluar
              </span>
              <svg className="w-[15px] h-[15px] text-[#61647C] dark:text-slate-400" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M1.875 5.625V8.125M1.875 6.875H4.375L8.75 10.625V3.125L4.375 6.875H1.875ZM11.25 5C11.875 5.625 11.875 8.125 11.25 8.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] font-normal text-[#61647C] dark:text-slate-400 leading-none">
                /hari
              </span>
            </div>
            <div className="mt-2">
              <div className="text-[19px] font-bold text-[#191B3D] dark:text-white tracking-tight leading-tight">
                {formatRupiah(displayDailyAvg)}
              </div>
              <div className="text-[11px] text-[#61647C] dark:text-slate-400 leading-snug mt-1">
                Hari ke-{currentDay} bulan ini
              </div>
            </div>
          </div>

          {/* Card 4: Pos Terbesar (Figma 1:2547) */}
          <div className="bg-white dark:bg-[#13192B] border border-[#DFE5EE] dark:border-slate-800 rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[11px] text-[#61647C] dark:text-slate-400 font-normal leading-[145%]">
                Pos Terbesar
              </span>
              <svg className="w-[15px] h-[15px] text-[#61647C] dark:text-slate-400" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M2.5 13.75V1.25M2.5 1.875H11.25C11.875 1.875 12.1875 2.5 11.875 3.125L10.625 5.625L11.875 8.125C12.1875 8.75 11.875 9.375 11.25 9.375H2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] font-bold text-[#22755F] leading-none">
                {topExpenseCategory ? `${topExpenseCategory.percentage}%` : '33,31%'}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-[19px] font-bold text-[#191B3D] dark:text-white tracking-tight leading-tight">
                {topExpenseCategory ? formatRupiah(topExpenseCategory.total_amount) : 'Rp 153.900'}
              </div>
              <div className="text-[11px] text-[#61647C] dark:text-slate-400 leading-snug mt-1">
                {topExpenseCategory ? `${topExpenseCategory.name} · ${topExpenseCategory.count || 1} transaksi` : 'Lainnya · 1 transaksi'}
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BENTO ROW 3: ARUS KAS & KATEGORI TERBESAR (Figma 1:2555)  */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Card Arus Kas (Figma 1:2557) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#13192B] border border-[#DFE5EE] dark:border-slate-800 rounded-3xl px-4.5 py-6 md:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div>
                <h3 className="text-[18px] font-bold text-[#191B3D] dark:text-white leading-tight">
                  Arus kas
                </h3>
                <div className="text-[28px] font-bold text-[#191B3D] dark:text-white tracking-tight mt-1 leading-tight">
                  {formatRupiah(surplus)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3.5 text-[12px] text-[#61647C] dark:text-slate-400 mt-2 mb-1">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D62]" />
                  Pemasukan
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#8E8FB0]" />
                  Pengeluaran
                </span>
              </div>

              <p className="text-[11px] text-[#61647C] dark:text-slate-400 leading-[145%] mb-4">
                Selisih pemasukan dikurangi pengeluaran
              </p>
            </div>

            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cashFlowChartData}
                  margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                  barCategoryGap="40%"
                >
                  <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v === 0
                        ? 'Rp 0'
                        : v >= 1000000
                        ? `Rp ${(v / 1000000).toFixed(v % 1000000 ? 1 : 0)} jt`
                        : `Rp ${Math.round(v / 1000)} rb`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Pemasukan" fill="#2E7D62" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Pengeluaran" fill="#8E8FB0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card Kategori Terbesar (Figma 1:2587) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#13192B] border border-[#DFE5EE] dark:border-slate-800 rounded-3xl px-4.5 py-6 md:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-[#191B3D] dark:text-white leading-tight mb-3">
                Kategori Terbesar
              </h3>

              {/* Dua Tombol Pilihan Filter (Figma 1:2590) */}
              <div className="flex items-center gap-2 mb-4">
                <div id="cat-filter-dropdown-wrapper" className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowCategoryTypeDropdown(false);
                    }}
                    className="h-10 px-3.5 rounded-[10px] border border-[#DFE5EE] dark:border-slate-700 bg-white dark:bg-[#1C2035] text-[12px] font-medium text-[#191B3D] dark:text-white flex items-center gap-2 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <span>{selectedCategoryFilter}</span>
                    <Icon name={showCategoryDropdown ? 'expand_less' : 'expand_more'} size={15} style={{ color: '#61647C' }} />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1.5 w-44 bg-white dark:bg-[#1C2035] border border-[#DFE5EE] dark:border-slate-700 rounded-xl shadow-xl p-1 z-30">
                      {['Kategori', 'Makanan & Minuman', 'Belanja', 'Lain-lain'].map((opt) => (
                        <div
                          key={opt}
                          onClick={() => {
                            setSelectedCategoryFilter(opt);
                            setShowCategoryDropdown(false);
                          }}
                          className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div id="cat-type-dropdown-wrapper" className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryTypeDropdown(!showCategoryTypeDropdown);
                      setShowCategoryDropdown(false);
                    }}
                    className="h-10 px-3.5 rounded-[10px] border border-[#DFE5EE] dark:border-slate-700 bg-white dark:bg-[#1C2035] text-[12px] font-medium text-[#191B3D] dark:text-white flex items-center gap-2 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <span>{categoryType}</span>
                    <Icon name={showCategoryTypeDropdown ? 'expand_less' : 'expand_more'} size={15} style={{ color: '#61647C' }} />
                  </button>
                  {showCategoryTypeDropdown && (
                    <div className="absolute top-full right-0 mt-1.5 w-36 bg-white dark:bg-[#1C2035] border border-[#DFE5EE] dark:border-slate-700 rounded-xl shadow-xl p-1 z-30">
                      {['Pengeluaran', 'Pemasukan'].map((t) => (
                        <div
                          key={t}
                          onClick={() => {
                            setCategoryType(t);
                            setShowCategoryTypeDropdown(false);
                          }}
                          className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#61647C] dark:text-slate-400 uppercase tracking-wider text-[11px]">
                  {categoryType === 'Pemasukan' ? 'TOTAL PEMASUKAN' : 'TOTAL PENGELUARAN'}
                </span>
                <span className="font-bold text-[#191B3D] dark:text-white text-[12px]">
                  {formatRupiah(totalAmountToShow)}
                </span>
              </div>

              {/* Alokasi Pengeluaran Multi-segmen Bar (Figma 1:2602) */}
              <div className="w-full h-2 rounded-[4px] overflow-hidden flex gap-[3px] bg-slate-100 dark:bg-slate-800 mb-5">
                <div className="h-full bg-[#2E7D62]" style={{ width: '33.31%' }} />
                <div className="h-full bg-[#5B5F79]" style={{ width: '31.71%' }} />
                <div className="h-full bg-[#A3BEAD]" style={{ width: '26.75%' }} />
                <div className="h-full bg-slate-200 dark:bg-slate-700 flex-1" />
              </div>

              {/* Category list */}
              <div className="space-y-3.5">
                {displayedCategories.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada data {categoryType.toLowerCase()} bulan ini.
                  </div>
                ) : (
                  displayedCategories.map((cat, idx) => (
                    <div key={cat.id || idx} className="flex items-center justify-between h-9">
                      <div className="flex items-center gap-3">
                        <div className="w-[34px] h-[34px] rounded-xl bg-[#F2F3F8] dark:bg-slate-800 flex items-center justify-center text-[#191B3D] dark:text-white shrink-0">
                          <Icon name={getCategoryIcon(cat.name)} size={18} />
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-[#191B3D] dark:text-white leading-tight">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-[#61647C] dark:text-slate-400 leading-tight mt-0.5">
                            {cat.percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="text-[12px] font-bold text-[#191B3D] dark:text-white">
                        {formatRupiah(cat.total_amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Kategori Lainnya Footer */}
            <div className="flex items-center justify-between text-[11px] pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 text-[#61647C] dark:text-slate-400">
              <span>{otherAmount > 0 ? `+ kategori lainnya (${formatRupiah(otherAmount)})` : `Total ${displayedCategories.length} kategori`}</span>
              <Link to="/transaksi" className="font-bold text-[#191B3D] dark:text-white hover:text-blue-600 transition-colors">
                Detail →
              </Link>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BENTO ROW 4: TRANSAKSI TERBARU (Figma 1:2634)             */}
        {/* ======================================================== */}
        <section className="bg-white dark:bg-[#13192B] border border-[#DFE5EE] dark:border-slate-800 rounded-3xl px-4.5 py-6 md:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] font-bold text-[#191B3D] dark:text-white leading-tight">
              Transaksi terbaru
            </h3>
            <Link
              to="/transaksi"
              className="text-[11px] font-medium text-[#61647C] dark:text-slate-400 hover:text-[#191B3D] transition-colors"
            >
              Semua transaksi →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {txList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada transaksi di periode ini.
              </div>
            ) : (
              txList.slice(0, 5).map((tx, idx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id || idx} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[14px] font-semibold text-[#191B3D] dark:text-white leading-tight">
                        {tx.description || tx.category_name || 'Transaksi'}
                      </div>
                      <div className="text-[11px] text-[#61647C] dark:text-slate-400 leading-tight">
                        {formatTxDateShort(tx.date)} · {tx.wallet_name || tx.category_name || 'Rekening Utama'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[13px] font-semibold ${isIncome ? 'text-emerald-600' : 'text-[#191B3D] dark:text-white'}`}>
                        {isIncome ? '+ ' : '- '}
                        {formatRupiah(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
