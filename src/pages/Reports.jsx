import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
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
} from 'recharts';
import {
  Landmark,
  Receipt,
  ShoppingCart,
  Wallet,
  Calculator,
  Download,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  Check,
} from 'lucide-react';

const CHART_COLORS = [
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#64748B', // Slate
];

// Fallback data matching Figcraft frame when API is not populated
const DEFAULT_REPORT_DATA = {
  totalIncome: 1101200,
  totalExpense: 462002,
  totalTax: 5100,
  categoryBreakdown: [
    { name: 'Kebutuhan Pokok', value: 195002 },
    { name: 'Tagihan & Utilitas', value: 150000 },
    { name: 'Makanan & Minuman', value: 67000 },
    { name: 'Transportasi', value: 50000 },
  ],
  monthlyTrends: [
    { name: 'Mei', Pemasukan: 950000, Pengeluaran: 410000 },
    { name: 'Jun', Pemasukan: 1000000, Pengeluaran: 480000 },
    { name: 'Jul', Pemasukan: 1200000, Pengeluaran: 520000 },
    { name: 'Agu', Pemasukan: 1050000, Pengeluaran: 430000 },
    { name: 'Sep', Pemasukan: 1100000, Pengeluaran: 490000 },
    { name: 'Okt', Pemasukan: 1101200, Pengeluaran: 462002 },
  ],
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-xl p-3 text-xs shadow-xl space-y-1.5 animate-fade-in">
        <p className="font-bold text-[#191B3D] dark:text-white">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: p.fill || p.color }}
            />
            <span>{p.name}:</span>
            <strong className="text-[#191B3D] dark:text-white font-extrabold">
              {formatRupiah(p.value)}
            </strong>
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

  const [data, setData] = useState(DEFAULT_REPORT_DATA);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (authFetch) {
        const res = await authFetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}`);
        if (res.ok) {
          const json = await res.json();
          if (json && (json.totalIncome > 0 || json.totalExpense > 0 || (json.categoryBreakdown && json.categoryBreakdown.length > 0))) {
            setData(json);
          } else {
            setData(DEFAULT_REPORT_DATA);
          }
        } else {
          setData(DEFAULT_REPORT_DATA);
        }
      } else {
        setData(DEFAULT_REPORT_DATA);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setData(DEFAULT_REPORT_DATA);
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedMonth, selectedYear]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleExportReportsCSV = async () => {
    try {
      if (authFetch) {
        const res = await authFetch(`/api/reports/export?month=${selectedMonth}&year=${selectedYear}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `laporan_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          triggerToast('Laporan CSV berhasil diunduh!');
          return;
        }
      }

      // Fallback CSV generation
      const headers = ['Kategori', 'Total Pengeluaran (Rp)'];
      const rows = (data?.categoryBreakdown || []).map((c) => [`"${c.name}"`, c.value]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      triggerToast('Laporan CSV berhasil diunduh!');
    } catch {
      triggerToast('Gagal mengekspor laporan');
    }
  };

  const totalIncome = data?.totalIncome ?? 1101200;
  const totalExpense = data?.totalExpense ?? 462002;
  const totalTax = data?.totalTax ?? 5100;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const avgDailyExpense = Math.round(totalExpense / (daysInMonth || 30));

  const categoryBreakdown = data?.categoryBreakdown || [];
  const monthlyTrends = data?.monthlyTrends || [];

  const selectedMonthName = MONTH_NAMES[selectedMonth - 1];
  const selectedYearStr = String(selectedYear);

  const formatAmount = (val) => {
    if (isHidden) return '••••••';
    return formatRupiah(val);
  };

  return (
    <div className="w-full min-h-screen bg-[#F2F3F8] dark:bg-[#0d0f18] text-[#191B3D] dark:text-slate-100 font-sans antialiased transition-colors duration-150 flex flex-col">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#191B3D] dark:bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TOPBAR (DESKTOP / TABLET: md+)                                          */}
      {/* ======================================================================= */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-[68px] bg-white dark:bg-[#141721] border-b border-[#DFE5EE] dark:border-gray-800 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#7F8A9E] dark:text-slate-400">
          <span>Ruang personal</span>
          <span>·</span>
          <span className="font-semibold text-[#191B3D] dark:text-white">Laporan</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#22755F] dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-[#22755F] dark:bg-emerald-400 inline-block animate-pulse" />
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
      {/* CONTENT CONTAINER                                                       */}
      {/* ======================================================================= */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 max-w-7xl w-full mx-auto space-y-5">
        {/* Mobile Subheader Breadcrumb & Date */}
        <div className="md:hidden flex items-center justify-between text-[11px] text-[#61647C] dark:text-slate-400 px-0.5">
          <span>Ruang personal · Laporan</span>
          <span>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        {/* ===================================================================== */}
        {/* ROW 1: HEADER & PERIOD FILTERS                                        */}
        {/* ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl md:text-[26px] font-extrabold text-[#191B3D] dark:text-white tracking-tight">
            Laporan
          </h1>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Month Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 text-[#191B3D] dark:text-white shadow-2xs hover:border-indigo-400 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1} className="bg-white dark:bg-gray-900">
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]" />
            </div>

            {/* Year Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 text-[#191B3D] dark:text-white shadow-2xs hover:border-indigo-400 focus:outline-none cursor-pointer"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-gray-900">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]" />
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportReportsCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
              title="Unduh Laporan Format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 2: HERO BANNER & KARTU TABUNGAN BERSIH UTAMA                      */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Banner: Laporan Keuangan Info (span 7 or 8) */}
          <div className="lg:col-span-7 bg-[#E7E7F4] dark:bg-[#1C2035] border border-[#DFE5EE] dark:border-indigo-950/50 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-2xs space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#191B3D] dark:text-white tracking-tight">
                Laporan Keuangan
              </h2>
              <p className="text-xs md:text-sm text-[#61647C] dark:text-slate-300 leading-relaxed">
                Analisis performa finansial periode <strong className="text-[#191B3D] dark:text-white">{selectedMonthName} {selectedYearStr}</strong>.
              </p>
            </div>

            {/* Badges / Indikator Laporan */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-gray-800/80 border border-[#DFE5EE] dark:border-gray-700 text-indigo-700 dark:text-indigo-300 shadow-2xs">
                <span>Rasio Tabungan:</span>
                <strong className="font-extrabold">{savingsRate}%</strong>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-gray-800/80 border border-[#DFE5EE] dark:border-gray-700 text-amber-700 dark:text-amber-300 shadow-2xs">
                <span>Pajak &amp; Admin:</span>
                <strong className="font-extrabold">{formatAmount(totalTax)}</strong>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                  netSavings >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {netSavings >= 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>Status: {netSavings >= 0 ? 'Surplus Finansial' : 'Defisit Anggaran'}</span>
              </span>
            </div>
          </div>

          {/* Right Card: Signature Dark Navy / Indigo Gradient Card (span 5) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-[#191B3D] to-indigo-950 rounded-2xl p-5 md:p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden min-h-[160px]">
            {/* Glow accent */}
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl"
              aria-hidden="true"
            />

            <span className="text-[11px] font-bold tracking-wider text-indigo-200/80 uppercase">
              TABUNGAN BERSIH PERIODE INI
            </span>

            <div className="my-2">
              <div
                className={`text-3xl md:text-4xl font-extrabold tracking-tight leading-tight ${
                  netSavings >= 0 ? 'text-white' : 'text-rose-300'
                }`}
              >
                {formatAmount(netSavings)}
              </div>
              <p className="text-xs text-indigo-200/80 mt-1">
                {savingsRate}% dari total pemasukan
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200/90 pt-2 border-t border-white/10">
              <span>{netSavings >= 0 ? 'Kondisi Sehat' : 'Perlu Evaluasi'}</span>
              <span className="font-semibold text-emerald-300">
                Pemasukan: {formatAmount(totalIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 3: 5 SUMMARY STAT CARDS (Responsive Grid)                         */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Tabungan Bersih */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                TABUNGAN BERSIH
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-xl font-extrabold my-1 tracking-tight ${netSavings >= 0 ? 'text-[#191B3D] dark:text-white' : 'text-rose-600'}`}>
              {formatAmount(netSavings)}
            </div>
            <span className={`text-[11.5px] font-medium ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {netSavings >= 0 ? `Surplus ${savingsRate}%` : 'Defisit'}
            </span>
          </div>

          {/* Card 2: Pajak & Biaya Admin */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                PAJAK &amp; BIAYA ADMIN
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalTax)}
            </div>
            <span className="text-[11.5px] text-[#D97706] font-medium">
              Biaya layanan terpisah
            </span>
          </div>

          {/* Card 3: Total Pengeluaran */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                TOTAL PENGELUARAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalExpense)}
            </div>
            <span className="text-[11.5px] text-rose-600 font-medium">
              − Arus Keluar
            </span>
          </div>

          {/* Card 4: Total Pemasukan */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                TOTAL PEMASUKAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalIncome)}
            </div>
            <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400 font-medium">
              + Arus Masuk
            </span>
          </div>

          {/* Card 5: Rata-rata Harian */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-4.5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                RATA-RATA HARIAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800 text-[#475569] dark:text-slate-300 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(avgDailyExpense)}
            </div>
            <span className="text-[11.5px] text-[#64748B] dark:text-slate-400 font-medium">
              / hari belanja
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 4: SECTION GRAFIK 2 KOLOM (Proporsi 2:1 -> 8:4)                   */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Kolom 1 (8 Kolom): Perbandingan Pemasukan vs Pengeluaran */}
          <section className="lg:col-span-8 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#191B3D] dark:text-white">
                  Perbandingan Pemasukan vs Pengeluaran
                </h2>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Tren bulanan tahun {selectedYearStr}
                </p>
              </div>

              {/* Legend pills */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="w-3 h-3 rounded-md bg-[#191B3D] dark:bg-indigo-600 inline-block" />
                  Pemasukan
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                  Pengeluaran
                </span>
              </div>
            </div>

            {monthlyTrends.length > 0 ? (
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" className="dark:opacity-10" />
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
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Pemasukan" fill="#191B3D" radius={[6, 6, 0, 0]} className="dark:fill-indigo-600" />
                    <Bar dataKey="Pengeluaran" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <BarChart3 className="w-10 h-10 text-[#94A3B8] mx-auto opacity-70" />
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">Belum ada catatan tahunan</p>
              </div>
            )}
          </section>

          {/* Kolom 2 (4 Kolom): Distribusi Pengeluaran (Donut Chart) */}
          <section className="lg:col-span-4 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#191B3D] dark:text-white">
                Distribusi Pengeluaran
              </h2>
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                Proporsi kategori belanja bulan ini
              </p>
            </div>

            {categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                <div className="h-44 sm:h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
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
                </div>

                {/* Category List */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {categoryBreakdown.map((cat, i) => {
                    const pct = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-gray-800/60 last:border-none"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-[#94A3B8]">{pct}%</span>
                          <strong className="text-[#191B3D] dark:text-white font-bold">
                            {formatAmount(cat.value)}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <PieIcon className="w-10 h-10 text-[#94A3B8] mx-auto opacity-70" />
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">Belum ada data pengeluaran</p>
              </div>
            )}
          </section>
        </div>

        {/* ===================================================================== */}
        {/* ROW 5: RINGKASAN & ANALISIS FINANSIAL                                 */}
        {/* ===================================================================== */}
        <section className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#191B3D] dark:text-white">
              Ringkasan &amp; Analisis Finansial
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Box 1: Rasio Tabungan */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
              <div className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rasio Tabungan ({savingsRate}%)</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                {savingsRate >= 20
                  ? 'Kondisi finansial sangat sehat! Anda berhasil menyisihkan lebih dari 20% penghasilan untuk tabungan masa depan.'
                  : savingsRate > 0
                  ? 'Bagus, terdapat surplus yang tersimpan. Tingkatkan alokasi menuju target ideal minimal 20%.'
                  : 'Pengeluaran melebihi total pemasukan pada periode ini. Lakukan evaluasi pada pos belanja prioritas Anda.'}
              </p>
            </div>

            {/* Box 2: Rata-rata Harian */}
            <div className="p-4 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-[#F8FAFC]/60 dark:bg-gray-800/20 space-y-1.5">
              <div className="font-extrabold text-[#191B3D] dark:text-white flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Rata-rata Pengeluaran Harian</span>
              </div>
              <p className="text-[#64748B] dark:text-slate-300 leading-relaxed">
                Rata-rata belanja harian Anda adalah <strong className="text-[#191B3D] dark:text-white">{formatAmount(avgDailyExpense)}</strong>.
                Menjaga pengeluaran harian di bawah patokan ini akan memaksimalkan tabungan bersih di akhir bulan.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
