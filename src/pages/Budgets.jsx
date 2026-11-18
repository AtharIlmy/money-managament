import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import {
  Wallet,
  Target,
  ShieldCheck,
  Receipt,
  Calculator,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Check,
  X,
  PieChart,
  RotateCcw,
} from 'lucide-react';

// Fallback dummy data for initial rich state if API has not been populated
const DEFAULT_BUDGETS = [
  {
    id: 1,
    category_id: 1,
    category_name: 'Makanan & Minuman',
    amount: 1500000,
    spent: 670000,
  },
  {
    id: 2,
    category_id: 2,
    category_name: 'Transportasi',
    amount: 500000,
    spent: 250000,
  },
  {
    id: 3,
    category_id: 3,
    category_name: 'Belanja & Hiburan',
    amount: 800000,
    spent: 420000,
  },
];

const DEFAULT_GOALS = [
  {
    id: 1,
    name: 'Dana Liburan Akhir Tahun',
    target_amount: 5000000,
    current_amount: 2500000,
    deadline: '2026-12-31',
    icon: '✈️',
  },
  {
    id: 2,
    name: 'Upgrade Laptop Kerja',
    target_amount: 15000000,
    current_amount: 6000000,
    deadline: '2027-03-31',
    icon: '💻',
  },
];

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Makanan & Minuman' },
  { id: 2, name: 'Transportasi' },
  { id: 3, name: 'Belanja & Hiburan' },
  { id: 4, name: 'Tagihan & Utilitas' },
  { id: 5, name: 'Kesehatan' },
  { id: 6, name: 'Pendidikan' },
];

// Helper to generate unique fallback id
const generateFallbackId = () => Date.now();

export default function Budgets() {
  const { authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();

  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [savingsModalGoal, setSavingsModalGoal] = useState(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'budget'|'goal', item }

  // Forms state
  const [budgetForm, setBudgetForm] = useState({ category_id: '', amount: '' });
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    icon: '🎯',
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load backend data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (authFetch) {
        const [budRes, goalRes, catRes] = await Promise.all([
          authFetch('/api/budgets'),
          authFetch('/api/goals'),
          authFetch('/api/categories?type=expense'),
        ]);

        let hasBud = false;
        let hasGoal = false;

        if (budRes && budRes.ok) {
          const budData = await budRes.json();
          if (Array.isArray(budData) && budData.length > 0) {
            setBudgets(budData);
            hasBud = true;
          }
        }
        if (!hasBud) setBudgets(DEFAULT_BUDGETS);

        if (goalRes && goalRes.ok) {
          const goalData = await goalRes.json();
          if (Array.isArray(goalData) && goalData.length > 0) {
            setGoals(goalData);
            hasGoal = true;
          }
        }
        if (!hasGoal) setGoals(DEFAULT_GOALS);

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            setCategories(catData);
          } else {
            setCategories(DEFAULT_CATEGORIES);
          }
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } else {
        setBudgets(DEFAULT_BUDGETS);
        setGoals(DEFAULT_GOALS);
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error('Failed to load budget data:', err);
      setBudgets(DEFAULT_BUDGETS);
      setGoals(DEFAULT_GOALS);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Submit Budget
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!budgetForm.category_id || !budgetForm.amount) {
      return setFormError('Pilih kategori dan tentukan nominal batasan.');
    }

    setSaving(true);
    try {
      if (authFetch) {
        const res = await authFetch('/api/budgets', {
          method: 'POST',
          body: JSON.stringify({
            category_id: budgetForm.category_id,
            amount: parseFloat(budgetForm.amount),
          }),
        });

        if (res.ok) {
          setShowBudgetModal(false);
          setBudgetForm({ category_id: '', amount: '' });
          triggerToast('Batas anggaran kategori berhasil disimpan!');
          loadData();
          return;
        }
      }

      // Fallback local addition
      const selectedCat = categories.find((c) => String(c.id) === String(budgetForm.category_id));
      const newBudget = {
        id: generateFallbackId(),
        category_id: budgetForm.category_id,
        category_name: selectedCat?.name || 'Kategori Baru',
        amount: parseFloat(budgetForm.amount),
        spent: 0,
      };
      setBudgets((prev) => [...prev, newBudget]);
      setShowBudgetModal(false);
      setBudgetForm({ category_id: '', amount: '' });
      triggerToast('Batas anggaran kategori berhasil disimpan!');
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // Submit Goal
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!goalForm.name || !goalForm.target_amount) {
      return setFormError('Nama target dan nominal target wajib diisi.');
    }

    setSaving(true);
    try {
      if (authFetch) {
        const res = await authFetch('/api/goals', {
          method: 'POST',
          body: JSON.stringify({
            ...goalForm,
            target_amount: parseFloat(goalForm.target_amount),
            current_amount: parseFloat(goalForm.current_amount || 0),
          }),
        });

        if (res.ok) {
          setShowGoalModal(false);
          setGoalForm({
            name: '',
            target_amount: '',
            current_amount: '',
            deadline: '',
            icon: '🎯',
          });
          triggerToast('Target impian berhasil ditambahkan!');
          loadData();
          return;
        }
      }

      // Fallback local addition
      const newGoal = {
        id: generateFallbackId(),
        name: goalForm.name,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: parseFloat(goalForm.current_amount || 0),
        deadline: goalForm.deadline || '',
        icon: goalForm.icon || '🎯',
      };
      setGoals((prev) => [...prev, newGoal]);
      setShowGoalModal(false);
      setGoalForm({
        name: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
        icon: '🎯',
      });
      triggerToast('Target impian berhasil ditambahkan!');
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // Add Savings to Goal
  const handleAddSavingsSubmit = async (e) => {
    e.preventDefault();
    if (!savingsModalGoal || !savingsAmount || parseFloat(savingsAmount) <= 0) return;
    const addAmt = parseFloat(savingsAmount);

    try {
      if (authFetch) {
        const res = await authFetch(`/api/goals/${savingsModalGoal.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            current_amount: parseFloat(savingsModalGoal.current_amount || 0) + addAmt,
          }),
        });
        if (res.ok) {
          setSavingsModalGoal(null);
          setSavingsAmount('');
          triggerToast('Tabungan berhasil ditambahkan!');
          loadData();
          return;
        }
      }

      // Fallback local update
      setGoals((prev) =>
        prev.map((g) =>
          g.id === savingsModalGoal.id
            ? { ...g, current_amount: parseFloat(g.current_amount || 0) + addAmt }
            : g
        )
      );
      setSavingsModalGoal(null);
      setSavingsAmount('');
      triggerToast('Tabungan berhasil ditambahkan!');
    } catch {
      triggerToast('Gagal menambahkan tabungan');
    }
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'budget') {
        if (authFetch) {
          await authFetch(`/api/budgets/${deletingItem.item.id}`, { method: 'DELETE' });
        }
        setBudgets((prev) => prev.filter((b) => b.id !== deletingItem.item.id));
        triggerToast('Anggaran berhasil dihapus');
      } else {
        if (authFetch) {
          await authFetch(`/api/goals/${deletingItem.item.id}`, { method: 'DELETE' });
        }
        setGoals((prev) => prev.filter((g) => g.id !== deletingItem.item.id));
        triggerToast('Target impian berhasil dihapus');
      }
      setDeletingItem(null);
      loadData();
    } catch {
      triggerToast('Gagal menghapus item');
    }
  };

  // Summary calculations
  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const spentRatio = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

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
          <span className="font-semibold text-[#191B3D] dark:text-white">Anggaran</span>
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
          <span>Ruang personal · Anggaran</span>
          <span>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        {/* ===================================================================== */}
        {/* ROW 1: HEADER & ACTIONS                                               */}
        {/* ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl md:text-[26px] font-extrabold text-[#191B3D] dark:text-white tracking-tight">
            Anggaran
          </h1>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowBudgetModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Buat Anggaran</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 text-[#61647C] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800/60 shadow-2xs transition-all cursor-pointer"
            >
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Target Impian</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 2: HERO BANNER & SISA KUOTA KARTU SALDO                           */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Banner: Anggaran & Tujuan (span 7 or 8) */}
          <div className="lg:col-span-7 bg-[#E7E7F4] dark:bg-[#1C2035] border border-[#DFE5EE] dark:border-indigo-950/50 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-2xs space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#191B3D] dark:text-white tracking-tight">
                Anggaran &amp; Tujuan
              </h2>
              <p className="text-xs md:text-sm text-[#61647C] dark:text-slate-300 leading-relaxed max-w-lg">
                Kendalikan batas pengeluaran bulanan dan wujudkan impian tabungan Anda secara terencana.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-2">
              <button
                type="button"
                onClick={() => setShowBudgetModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-[#191B3D] dark:text-white border border-[#DFE5EE] dark:border-gray-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Plafon Anggaran</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-[#191B3D] dark:text-white border border-[#DFE5EE] dark:border-gray-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Buat Target Impian</span>
              </button>
            </div>
          </div>

          {/* Right Card: Signature Dark Navy / Indigo Gradient Saldo Card (span 5) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-[#191B3D] to-indigo-950 rounded-2xl p-5 md:p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden min-h-[160px]">
            {/* Glow accent */}
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl"
              aria-hidden="true"
            />

            <span className="text-[11px] font-bold tracking-wider text-indigo-200/80 uppercase">
              SISA KUOTA ANGGARAN
            </span>

            <div className="my-2">
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {formatAmount(remainingBudget)}
              </div>
              <p className="text-xs text-indigo-200/80 mt-1">
                Dari total budget {formatAmount(totalBudget)}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200/90 pt-2 border-t border-white/10">
              <span>{budgets.length} kategori aktif</span>
              <span className="font-semibold text-emerald-300">
                {totalBudget > 0 ? `${100 - spentRatio}% kuota tersisa` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 3: 3 SUMMARY STAT CARDS (Responsive Grid)                         */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Stat 1: Sisa Dana Aman */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                SISA DANA AMAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(remainingBudget)}
            </div>
            <span className={`text-xs ${remainingBudget > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 font-bold'}`}>
              {remainingBudget > 0 ? 'Dalam batas anggaran aman' : 'Anggaran terlampaui!'}
            </span>
          </div>

          {/* Stat 2: Realisasi Pengeluaran */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                REALISASI PENGELUARAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalSpent)}
            </div>
            <span className="text-xs text-[#94A3B8] dark:text-slate-400">
              {totalBudget > 0 ? `${spentRatio}% dari alokasi budget` : 'Belum ada data'}
            </span>
          </div>

          {/* Stat 3: Total Alokasi Anggaran */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[105px] transition-all sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                TOTAL ALOKASI ANGGARAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalBudget)}
            </div>
            <span className="text-xs text-[#94A3B8] dark:text-slate-400">
              {budgets.length} kategori direncanakan
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 4: BOTTOM SECTION 2:1 (Anggaran per Kategori & Target Impian)     */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Kolom Kiri: Anggaran per Kategori (Proporsi 2:1 -> 8 Kolom) */}
          <section className="lg:col-span-8 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#191B3D] dark:text-white">
                  Anggaran per Kategori
                </h2>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Pantau realisasi pengeluaran terhadap batas pagu bulanan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBudgetModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-gray-800 border border-[#DFE5EE] dark:border-gray-700 text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700/60 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kategori</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">Memuat anggaran...</p>
              </div>
            ) : budgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {budgets.map((b) => {
                  const spent = parseFloat(b.spent || 0);
                  const limit = parseFloat(b.amount || 1);
                  const pct = Math.min(Math.round((spent / limit) * 100), 100);
                  const isOver = spent > limit;

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-[#F8FAFC]/50 dark:bg-gray-800/30 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                            <PieChart className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#191B3D] dark:text-white leading-tight">
                              {b.category_name}
                            </div>
                            <span className="text-[11px] text-[#7F8A9E] dark:text-slate-400">
                              Alokasi Bulanan
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeletingItem({ type: 'budget', item: b })}
                          className="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all cursor-pointer"
                          title="Hapus anggaran kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Progress and numbers */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B] dark:text-slate-400">
                            Terpakai: <strong className="text-[#191B3D] dark:text-white">{formatAmount(spent)}</strong>
                          </span>
                          <span
                            className={`font-bold ${
                              isOver
                                ? 'text-rose-600'
                                : pct > 80
                                ? 'text-amber-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>

                        {/* Progress bar container */}
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-600'
                                : pct > 80
                                ? 'bg-amber-500'
                                : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#7F8A9E] dark:text-slate-400 pt-0.5">
                          <span>Batas: {formatAmount(limit)}</span>
                          <span
                            className={`font-semibold ${
                              isOver ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isOver ? `Over ${formatAmount(spent - limit)}` : `Sisa ${formatAmount(limit - spent)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <PieChart className="w-10 h-10 text-[#94A3B8] mx-auto opacity-70" />
                <div className="font-bold text-sm text-[#191B3D] dark:text-white">
                  Belum ada batasan anggaran
                </div>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400 max-w-sm mx-auto">
                  Buat rencana anggaran bulanan untuk mengontrol pengeluaran tiap kategori belanja.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pasang Batas Anggaran</span>
                </button>
              </div>
            )}
          </section>

          {/* Kolom Kanan: Tujuan Tabungan & Impian Finansial (Proporsi 2:1 -> 4 Kolom) */}
          <section className="lg:col-span-4 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#191B3D] dark:text-white">
                  Target Impian
                </h2>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Tabungan terarah
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-gray-800 border border-[#DFE5EE] dark:border-gray-700 text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700/60 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat</span>
              </button>
            </div>

            {goals.length > 0 ? (
              <div className="space-y-3.5 pt-1">
                {goals.map((g) => {
                  const current = parseFloat(g.current_amount || 0);
                  const target = parseFloat(g.target_amount || 1);
                  const pct = Math.min(Math.round((current / target) * 100), 100);

                  return (
                    <div
                      key={g.id}
                      className="p-4 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-[#F8FAFC]/50 dark:bg-gray-800/30 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                            {g.icon || '🎯'}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#191B3D] dark:text-white leading-tight">
                              {g.name}
                            </div>
                            {g.deadline && (
                              <span className="text-[11px] text-[#7F8A9E] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" /> Target: {formatDateShort(g.deadline)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeletingItem({ type: 'goal', item: g })}
                          className="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all cursor-pointer"
                          title="Hapus target impian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatAmount(current)}
                          </span>
                          <span className="text-[#7F8A9E] dark:text-slate-400">
                            dari {formatAmount(target)}
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-[#191B3D] dark:text-white">
                            {pct}% Terkumpul
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setSavingsModalGoal(g);
                              setSavingsAmount('500000');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-gray-800 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-slate-200 hover:border-indigo-400 transition-all cursor-pointer"
                          >
                            + Nabung
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <Target className="w-10 h-10 text-[#94A3B8] mx-auto opacity-70" />
                <div className="font-bold text-sm text-[#191B3D] dark:text-white">
                  Belum ada target impian
                </div>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400 max-w-xs mx-auto">
                  Rencanakan tabungan impian seperti liburan, gadget, atau dana darurat.
                </p>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Target Impian</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ======================================================================= */}
      {/* MODAL: TAMBAH ANGGARAN KATEGORI                                         */}
      {/* ======================================================================= */}
      {showBudgetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowBudgetModal(false)}
        >
          <div
            className="bg-white dark:bg-[#141721] rounded-2xl border border-[#DFE5EE] dark:border-gray-800 shadow-2xl w-full max-w-md p-5 md:p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#191B3D] dark:text-white">
                  Pasang Batas Anggaran
                </h3>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Tentukan limit belanja bulanan per kategori
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="w-8 h-8 rounded-full border border-[#DFE5EE] dark:border-gray-700 flex items-center justify-center text-[#64748B] hover:text-[#191B3D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleBudgetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Kategori Pengeluaran *
                </label>
                <select
                  value={budgetForm.category_id}
                  onChange={(e) => setBudgetForm((f) => ({ ...f, category_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Nominal Batas Anggaran (Rp) *
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 1500000"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Batas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: TAMBAH TARGET IMPIAN                                             */}
      {/* ======================================================================= */}
      {showGoalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowGoalModal(false)}
        >
          <div
            className="bg-white dark:bg-[#141721] rounded-2xl border border-[#DFE5EE] dark:border-gray-800 shadow-2xl w-full max-w-md p-5 md:p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#191B3D] dark:text-white">
                  Buat Target Impian
                </h3>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Targetkan dana tabungan untuk impian finansial Anda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="w-8 h-8 rounded-full border border-[#DFE5EE] dark:border-gray-700 flex items-center justify-center text-[#64748B] hover:text-[#191B3D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleGoalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Nama Target Impian *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Laptop Baru, Liburan Jepang..."
                  value={goalForm.name}
                  onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Target Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="10000000"
                    value={goalForm.target_amount}
                    onChange={(e) => setGoalForm((f) => ({ ...f, target_amount: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={goalForm.current_amount}
                    onChange={(e) => setGoalForm((f) => ({ ...f, current_amount: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Ikon Emoji
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="🎯, ✈️, 💻..."
                    value={goalForm.icon}
                    onChange={(e) => setGoalForm((f) => ({ ...f, icon: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500 text-center text-base"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Impian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: TAMBAH TABUNGAN KE TARGET                                        */}
      {/* ======================================================================= */}
      {savingsModalGoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setSavingsModalGoal(null)}
        >
          <div
            className="bg-white dark:bg-[#141721] rounded-2xl border border-[#DFE5EE] dark:border-gray-800 shadow-2xl w-full max-w-sm p-5 md:p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                  Tambah Tabungan
                </h3>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Untuk: <strong>{savingsModalGoal.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSavingsModalGoal(null)}
                className="w-8 h-8 rounded-full border border-[#DFE5EE] dark:border-gray-700 flex items-center justify-center text-[#64748B] hover:text-[#191B3D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSavingsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Nominal Tambahan (Rp)
                </label>
                <input
                  type="number"
                  placeholder="500000"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500 font-bold text-sm"
                />
              </div>

              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[100000, 250000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSavingsAmount(String(val))}
                    className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-gray-800 border border-[#DFE5EE] dark:border-gray-700 text-[11px] font-semibold text-[#475569] dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                  >
                    +{formatRupiah(val)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSavingsModalGoal(null)}
                  className="px-4 py-2.5 rounded-xl font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  + Tambah Tabungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS                                                 */}
      {/* ======================================================================= */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="bg-white dark:bg-[#141721] rounded-2xl border border-[#DFE5EE] dark:border-gray-800 shadow-2xl w-full max-w-sm p-5 md:p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                Hapus {deletingItem.type === 'budget' ? 'Anggaran Kategori' : 'Target Impian'}?
              </h4>
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                Apakah Anda yakin ingin menghapus catatan{' '}
                <strong className="text-[#191B3D] dark:text-white">
                  &quot;{deletingItem.item.category_name || deletingItem.item.name}&quot;
                </strong>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#64748B] dark:text-slate-300 text-xs hover:bg-slate-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-sm transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
