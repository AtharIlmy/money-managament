'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  ArrowUpDown,
  PieChart,
  BarChart3,
  Wallet,
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  Utensils,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Clock,
  Flag,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Custom Tooltip matching Figma visual style
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#DFE5EE] rounded-2xl p-3 shadow-lg text-xs font-sans">
        <p className="font-bold text-[#191B3D] mb-1.5">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[#61647C]">{item.name}:</span>
            <span className="font-bold text-[#191B3D]">
              Rp {Number(item.value).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [isDark, setIsDark] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Oktober 2026');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Kategori');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categoryType, setCategoryType] = useState('Pengeluaran');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Default data directly mapped from Figma frame "Dasbor v14 / Mobile" (Node 1:2489)
  const [dashboardData, setDashboardData] = useState({
    userName: 'Muhammad',
    balance: 654790,
    income: 1101200,
    incomeChange: '11%',
    expense: 462002,
    expenseRatio: '41,96%',
    dailyAvgExpense: 21000,
    currentDay: 22,
    topExpenseAmount: 153900,
    topExpenseRatio: '33,31%',
    topExpenseCategory: 'Lainnya',
    topExpenseCount: 1,
    surplus: 639198,
    categories: [
      { id: 1, name: 'Lain-lain', percentage: '33,31%', amount: 153900, icon: 'layers', color: '#2E7D62' },
      { id: 2, name: 'Makanan & Minuman', percentage: '31,71%', amount: 146502, icon: 'utensils', color: '#5B5F79' },
      { id: 3, name: 'Belanja', percentage: '26,75%', amount: 123600, icon: 'shopping', color: '#A3BEAD' },
    ],
    otherCategoriesAmount: 38000,
    cashFlowData: [
      { name: 'Okt', Pemasukan: 1101200, Pengeluaran: 462002 },
    ],
    recentTransactions: [
      { id: 1, name: 'Mixue', category: 'Gopay', date: '19 Okt', amount: 39000, type: 'expense' },
      { id: 2, name: 'Sarapan', category: 'Rekening Utama', date: '19 Okt', amount: 15000, type: 'expense' },
      { id: 3, name: 'Parfume', category: 'Rekening Utama', date: '19 Okt', amount: 123600, type: 'expense' },
    ],
  });

  // Optional live API sync
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const apiData = await res.json();
          if (apiData) {
            setDashboardData((prev) => ({
              ...prev,
              userName: apiData.userName || prev.userName,
              balance: apiData.balance ?? prev.balance,
              income: apiData.income ?? prev.income,
              expense: apiData.expense ?? prev.expense,
              surplus: (apiData.income || prev.income) - (apiData.expense || prev.expense),
            }));
          }
        }
      } catch {
        // Fallback silently to Figma mock values
      }
    }
    loadData();
  }, []);

  const formatRupiah = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const periodOptions = [
    'Oktober 2026',
    'September 2026',
    'Agustus 2026',
    'Juli 2026',
    'Tahun 2026',
  ];

  const categoryFilterOptions = ['Kategori', 'Makanan & Minuman', 'Belanja', 'Lain-lain'];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#0A0B14] text-slate-100' : 'bg-[#F2F3F8] text-[#191B3D]'} font-sans flex flex-col md:flex-row antialiased`}>
      {/* ============================================================ */}
      {/* TABLET & DESKTOP SIDEBAR (Hidden on mobile < 768px)          */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col justify-between w-18 lg:w-56 bg-[#101126] text-white shrink-0 sticky top-0 h-screen z-40 border-r border-[#263041]">
        <div>
          {/* Logo brand */}
          <div className="flex items-center gap-3 px-4 lg:px-6 h-17 border-b border-[#263041]/70">
            <div className="w-7 h-7 rounded-[7px] bg-[#191B3D] border border-slate-700/50 flex items-center justify-center shrink-0 shadow-sm">
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden lg:inline text-xs font-bold tracking-tight text-[#b8b9cc]">
              Money Management
            </span>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs lg:text-sm transition-colors"
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-white" />
              <span className="hidden lg:inline">Dasbor</span>
            </Link>
            <Link
              href="/transaksi"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8A99AD] hover:text-white hover:bg-white/5 font-medium text-xs lg:text-sm transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Transaksi</span>
            </Link>
            <Link
              href="/anggaran"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8A99AD] hover:text-white hover:bg-white/5 font-medium text-xs lg:text-sm transition-colors"
            >
              <PieChart className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Anggaran</span>
            </Link>
            <Link
              href="/laporan"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8A99AD] hover:text-white hover:bg-white/5 font-medium text-xs lg:text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Laporan</span>
            </Link>
            <Link
              href="/dompet"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8A99AD] hover:text-white hover:bg-white/5 font-medium text-xs lg:text-sm transition-colors"
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Dompet</span>
            </Link>
          </nav>
        </div>

        {/* User initials */}
        <div className="p-3 border-t border-[#263041]/70">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              MA
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{dashboardData.userName}</p>
              <p className="text-[11px] text-[#8A99AD] truncate">Akun Personal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTAINER (MOBILE FIRST ARCHITECTURE)                   */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        {/* ========================================================== */}
        {/* BILAH APLIKASI (Mobile Top Bar: Height 68px, Figma 1:2491)  */}
        {/* ========================================================== */}
        <header className="md:hidden flex items-center justify-between px-5 h-[68px] bg-white border-b border-[#DFE5EE] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger Button */}
            <button
              type="button"
              className="text-[#191B3D] p-1 -ml-1 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Menu Navigasi"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>

            {/* Logo Money Management */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#191B3D] flex items-center justify-center text-white shrink-0 shadow-xs">
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#61647C] tracking-normal font-sans">
                Money Management
              </span>
            </div>
          </div>

          {/* Bell Notification */}
          <button
            type="button"
            className="text-[#191B3D] p-1 rounded-lg hover:bg-slate-50 transition-colors"
            aria-label="Pemberitahuan"
          >
            <Bell className="w-[17px] h-[17px]" />
          </button>
        </header>

        {/* Desktop / Tablet Topbar */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-16 bg-white border-b border-[#DFE5EE] sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs lg:text-sm text-[#61647C]">
            <span>Ruang personal</span>
            <span>·</span>
            <span className="font-semibold text-[#191B3D]">Dasbor</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Data tersimpan
            </div>
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg text-[#61647C] hover:bg-slate-100 transition-colors"
              aria-label="Mode Gelap"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#61647C]" />}
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-[#61647C] hover:bg-slate-100 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#61647C] font-medium">
              22 Oktober 2026
            </span>
          </div>
        </header>

        {/* ========================================================== */}
        {/* PERIODE HALAMAN (Breadcrumb & Date, Figma 1:2503)           */}
        {/* ========================================================== */}
        <div className="md:hidden flex items-center justify-between px-5 pt-3 text-[11px] text-[#61647C] leading-[145%]">
          <span>Ruang personal · Dasbor</span>
          <span>22 Oktober 2026</span>
        </div>

        {/* ========================================================== */}
        {/* KONTEN HALAMAN (Padding 20px 20px 32px, Figma 1:2506)       */}
        {/* ========================================================== */}
        <main className="flex-1 px-5 pt-3 md:pt-6 md:px-7 lg:px-8 max-w-7xl w-full mx-auto space-y-4 md:space-y-5">
          {/* Judul Halaman: Dasbor (Figma 1:2507) */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#191B3D] tracking-[-0.8px] leading-[32px]">
            Dasbor
          </h1>

          {/* ======================================================== */}
          {/* RINGKASAN UTAMA (Hero Greeting + Saldo, Figma 1:2509)     */}
          {/* ======================================================== */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Informasi Utama: Sapaan Lavender (Figma 1:2510) */}
            <div className="md:col-span-7 lg:col-span-8 bg-[#E7E7F4] rounded-3xl p-5 md:p-6 lg:p-7 flex flex-col justify-between shadow-xs">
              <div>
                <h2 className="text-[23px] font-bold text-[#191B3D] tracking-[-0.7px] leading-[125%]">
                  Selamat siang, {dashboardData.userName}
                </h2>
                <p className="text-[13px] text-[#61647C] leading-[145%] mt-1.5 mb-4">
                  Lihat ke mana uangmu mengalir, dan apa yang bisa tumbuh.
                </p>
              </div>

              {/* Pilihan Filter Dropdown (Figma 1:2514) */}
              <div className="relative inline-block self-start">
                <button
                  type="button"
                  onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                  className="h-10 px-3.5 rounded-[10px] bg-white border border-[#DFE5EE] text-[12px] font-medium text-[#191B3D] flex items-center gap-4 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#61647C]" />
                </button>

                {periodDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-[#DFE5EE] rounded-2xl shadow-xl p-1.5 z-30">
                    {periodOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(opt);
                          setPeriodDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                          selectedPeriod === opt
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedPeriod === opt && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Saldo Utama: Midnight Card (Figma 1:2518) */}
            <div className="md:col-span-5 lg:col-span-4 bg-[#191B3D] rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-xs min-h-[143px]">
              {/* Progressive Blur Ellipse */}
              <div
                className="absolute -right-12 -top-6 w-[280px] h-[160px] rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <span className="text-[12px] text-white/90 leading-[145%]">
                  Saldo tersedia
                </span>
                <div className="text-[34px] font-bold text-white tracking-[-0.7px] leading-[145%] my-1">
                  {formatRupiah(dashboardData.balance)}
                </div>
                <span className="text-[12px] text-white/80 leading-[145%]">
                  Total saldo dompet · Aktif
                </span>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* RINGKASAN KEUANGAN: 4 STAT CARDS (Figma 1:2522)           */}
          {/* ======================================================== */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Pemasukan (Lavender Accent, Figma 1:2523) */}
            <div className="bg-[#E7E7F4] rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[11px] text-[#61647C] font-normal leading-[145%]">
                  Pemasukan
                </span>
                <svg className="w-[15px] h-[15px] text-[#191B3D]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M10.625 4.375L4.375 10.625M4.375 10.625H9.687M4.375 10.625V5.313" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-bold text-[#22755F] leading-none">
                  {dashboardData.incomeChange}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[19px] font-bold text-[#191B3D] tracking-tight leading-tight">
                  {formatRupiah(dashboardData.income)}
                </div>
                <div className="text-[11px] text-[#61647C] leading-snug mt-1">
                  Total pemasukan bulan ini
                </div>
              </div>
            </div>

            {/* Card 2: Pengeluaran (White Card, Figma 1:2531) */}
            <div className="bg-white border border-[#DFE5EE] rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[11px] text-[#61647C] font-normal leading-[145%]">
                  Pengeluaran
                </span>
                <svg className="w-[15px] h-[15px] text-[#61647C]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4.375 10.625L10.625 4.375M10.625 4.375H5.313M10.625 4.375V9.687" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-bold text-[#22755F] leading-none">
                  {dashboardData.expenseRatio}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[19px] font-bold text-[#191B3D] tracking-tight leading-tight">
                  {formatRupiah(dashboardData.expense)}
                </div>
                <div className="text-[11px] text-[#61647C] leading-snug mt-1">
                  Total pengeluaran bulan ini
                </div>
              </div>
            </div>

            {/* Card 3: Rata-rata Keluar (White Card, Figma 1:2539) */}
            <div className="bg-white border border-[#DFE5EE] rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[11px] text-[#61647C] font-normal leading-[145%]">
                  Rata-rata Keluar
                </span>
                <svg className="w-[15px] h-[15px] text-[#61647C]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M1.875 5.625V8.125M1.875 6.875H4.375L8.75 10.625V3.125L4.375 6.875H1.875ZM11.25 5C11.875 5.625 11.875 8.125 11.25 8.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[11px] font-normal text-[#61647C] leading-none">
                  /hari
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[19px] font-bold text-[#191B3D] tracking-tight leading-tight">
                  {formatRupiah(dashboardData.dailyAvgExpense)}
                </div>
                <div className="text-[11px] text-[#61647C] leading-snug mt-1">
                  Hari ke-{dashboardData.currentDay} bulan ini
                </div>
              </div>
            </div>

            {/* Card 4: Pos Terbesar (White Card, Figma 1:2547) */}
            <div className="bg-white border border-[#DFE5EE] rounded-3xl p-4 md:p-4.5 flex flex-col justify-between shadow-xs min-h-[152px]">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[11px] text-[#61647C] font-normal leading-[145%]">
                  Pos Terbesar
                </span>
                <svg className="w-[15px] h-[15px] text-[#61647C]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M2.5 13.75V1.25M2.5 1.875H11.25C11.875 1.875 12.1875 2.5 11.875 3.125L10.625 5.625L11.875 8.125C12.1875 8.75 11.875 9.375 11.25 9.375H2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-bold text-[#22755F] leading-none">
                  {dashboardData.topExpenseRatio}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[19px] font-bold text-[#191B3D] tracking-tight leading-tight">
                  {formatRupiah(dashboardData.topExpenseAmount)}
                </div>
                <div className="text-[11px] text-[#61647C] leading-snug mt-1">
                  {dashboardData.topExpenseCategory} · {dashboardData.topExpenseCount} transaksi
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* ANALISIS DASBOR: ARUS KAS & KATEGORI (Figma 1:2555)       */}
          {/* ======================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Arus Kas Card (Figma 1:2557) */}
            <div className="lg:col-span-7 bg-white border border-[#DFE5EE] rounded-3xl px-4.5 py-6 md:p-7 shadow-xs flex flex-col justify-between">
              <div>
                {/* Judul Panel */}
                <div>
                  <h3 className="text-[18px] font-bold text-[#191B3D] leading-tight">
                    Arus kas
                  </h3>
                  <div className="text-[28px] font-bold text-[#191B3D] tracking-tight mt-1 leading-tight">
                    {formatRupiah(dashboardData.surplus)}
                  </div>
                </div>

                {/* Legenda */}
                <div className="flex items-center justify-end gap-3.5 text-[12px] text-[#61647C] mt-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D62]" />
                    Pemasukan
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#8E8FB0]" />
                    Pengeluaran
                  </span>
                </div>

                {/* Keterangan */}
                <p className="text-[11px] text-[#61647C] leading-[145%] mb-4">
                  Selisih pemasukan dikurangi pengeluaran
                </p>
              </div>

              {/* Grafik Bar Arus Kas */}
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.cashFlowData}
                    margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                    barCategoryGap="40%"
                  >
                    <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                    />
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

            {/* Kategori Terbesar Card (Figma 1:2587) */}
            <div className="lg:col-span-5 bg-white border border-[#DFE5EE] rounded-3xl px-4.5 py-6 md:p-7 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header Judul Panel */}
                <h3 className="text-[18px] font-bold text-[#191B3D] leading-tight mb-3">
                  Kategori Terbesar
                </h3>

                {/* Dua Tombol Pilihan Filter (Figma 1:2590) */}
                <div className="flex items-center gap-2 mb-4">
                  {/* Pilihan Filter Kategori */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryDropdownOpen(!categoryDropdownOpen);
                        setTypeDropdownOpen(false);
                      }}
                      className="h-10 px-3.5 rounded-[10px] border border-[#DFE5EE] bg-white text-[12px] font-medium text-[#191B3D] flex items-center gap-2 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      <span>{selectedCategoryFilter}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#61647C]" />
                    </button>
                    {categoryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-[#DFE5EE] rounded-xl shadow-xl p-1 z-30">
                        {categoryFilterOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryFilter(opt);
                              setCategoryDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pilihan Filter Jenis */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setTypeDropdownOpen(!typeDropdownOpen);
                        setCategoryDropdownOpen(false);
                      }}
                      className="h-10 px-3.5 rounded-[10px] border border-[#DFE5EE] bg-white text-[12px] font-medium text-[#191B3D] flex items-center gap-2 shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      <span>{categoryType}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#61647C]" />
                    </button>
                    {typeDropdownOpen && (
                      <div className="absolute top-full right-0 mt-1.5 w-36 bg-white border border-[#DFE5EE] rounded-xl shadow-xl p-1 z-30">
                        {['Pengeluaran', 'Pemasukan'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setCategoryType(t);
                              setTypeDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Row (Figma 1:2599) */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#61647C] uppercase tracking-wider text-[11px]">
                    TOTAL PENGELUARAN
                  </span>
                  <span className="font-bold text-[#191B3D] text-[12px]">
                    {formatRupiah(dashboardData.expense)}
                  </span>
                </div>

                {/* Alokasi Pengeluaran Multi-segmen Bar (Figma 1:2602) */}
                <div className="w-full h-2 rounded-[4px] overflow-hidden flex gap-[3px] bg-slate-100 mb-5">
                  <div className="h-full bg-[#2E7D62]" style={{ width: '33.31%' }} />
                  <div className="h-full bg-[#5B5F79]" style={{ width: '31.71%' }} />
                  <div className="h-full bg-[#A3BEAD]" style={{ width: '26.75%' }} />
                  <div className="h-full bg-[#E2E8F0] flex-1" />
                </div>

                {/* Daftar Kategori Pengeluaran (Figma 1:2607) */}
                <div className="space-y-3.5">
                  {dashboardData.categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between h-9">
                      <div className="flex items-center gap-3">
                        <div className="w-[34px] h-[34px] rounded-xl bg-[#F2F3F8] flex items-center justify-center text-[#191B3D] shrink-0">
                          {cat.icon === 'layers' && <Layers className="w-4 h-4" />}
                          {cat.icon === 'utensils' && <Utensils className="w-4 h-4" />}
                          {cat.icon === 'shopping' && <ShoppingBag className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-[#191B3D] leading-tight">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-[#61647C] leading-tight mt-0.5">
                            {cat.percentage}
                          </div>
                        </div>
                      </div>
                      <div className="text-[12px] font-bold text-[#191B3D]">
                        {formatRupiah(cat.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kategori Lainnya Footer (Figma 1:2631) */}
              <div className="flex items-center justify-between text-[11px] pt-4 border-t border-slate-100 mt-5 text-[#61647C]">
                <span>+ kategori lainnya ({formatRupiah(dashboardData.otherCategoriesAmount)})</span>
                <Link
                  href="/transaksi"
                  className="font-bold text-[#191B3D] hover:text-blue-600 transition-colors"
                >
                  Detail →
                </Link>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* TRANSAKSI TERBARU (Figma 1:2634)                          */}
          {/* ======================================================== */}
          <section className="bg-white border border-[#DFE5EE] rounded-3xl px-4.5 py-6 md:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold text-[#191B3D] leading-tight">
                Transaksi terbaru
              </h3>
              <Link
                href="/transaksi"
                className="text-[11px] font-medium text-[#61647C] hover:text-[#191B3D] transition-colors"
              >
                Semua transaksi →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {dashboardData.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-0">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[14px] font-semibold text-[#191B3D] leading-tight">
                      {tx.name}
                    </div>
                    <div className="text-[11px] text-[#61647C] leading-tight">
                      {tx.date} · {tx.category}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[13px] font-semibold text-[#191B3D]">
                      - {formatRupiah(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ========================================================== */}
        {/* NAVIGASI SELULER (Bottom Navbar, Figma 1:2660)             */}
        {/* ========================================================== */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#101126] border-t border-[#263041] rounded-t-[20px] shadow-2xl z-40 px-3 py-2.5"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
        >
          <div className="grid grid-cols-5 items-center max-w-sm mx-auto">
            {/* Dasbor (Active) */}
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center gap-1 text-white py-1 transition-colors"
            >
              <LayoutGrid className="w-[18px] h-[18px] text-white" />
              <span className="text-[10px] font-bold text-white leading-none">Dasbor</span>
            </Link>

            {/* Transaksi */}
            <Link
              href="/transaksi"
              className="flex flex-col items-center justify-center gap-1 text-[#8A99AD] hover:text-white py-1 transition-colors"
            >
              <ArrowUpDown className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium leading-none">Transaksi</span>
            </Link>

            {/* Anggaran */}
            <Link
              href="/anggaran"
              className="flex flex-col items-center justify-center gap-1 text-[#8A99AD] hover:text-white py-1 transition-colors"
            >
              <PieChart className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium leading-none">Anggaran</span>
            </Link>

            {/* Laporan */}
            <Link
              href="/laporan"
              className="flex flex-col items-center justify-center gap-1 text-[#8A99AD] hover:text-white py-1 transition-colors"
            >
              <BarChart3 className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium leading-none">Laporan</span>
            </Link>

            {/* Dompet */}
            <Link
              href="/dompet"
              className="flex flex-col items-center justify-center gap-1 text-[#8A99AD] hover:text-white py-1 transition-colors"
            >
              <Wallet className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium leading-none">Dompet</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
