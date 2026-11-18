import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import {
  getNotificationPermission,
  notifyTransactionCreated,
  requestNotificationPermission,
  checkAndSendDailyReminder,
} from '../lib/notifications';
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  X,
  Check,
  Receipt,
  RotateCcw,
  AlertCircle,
  FileText,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
} from 'lucide-react';

// Fallback dummy transactions matching Figcraft frame when API is not populated
const DEFAULT_TRANSACTIONS = [
  {
    id: 1,
    description: 'Mixue',
    category_name: 'Makanan & Minuman',
    type: 'expense',
    wallet_name: 'Gopay',
    wallet_id: 2,
    amount: 39000,
    tax_amount: 0,
    date: '2026-10-19',
  },
  {
    id: 2,
    description: 'Kopi Kenangan',
    category_name: 'Makanan & Minuman',
    type: 'expense',
    wallet_name: 'Gopay',
    wallet_id: 2,
    amount: 28000,
    tax_amount: 2500,
    date: '2026-10-18',
  },
  {
    id: 3,
    description: 'Listrik PLN',
    category_name: 'Tagihan',
    type: 'expense',
    wallet_name: 'Rekening Utama',
    wallet_id: 1,
    amount: 150000,
    tax_amount: 2600,
    date: '2026-10-15',
  },
  {
    id: 4,
    description: 'Bensin Pertamax',
    category_name: 'Transportasi',
    type: 'expense',
    wallet_name: 'Rekening Utama',
    wallet_id: 1,
    amount: 50000,
    tax_amount: 0,
    date: '2026-10-14',
  },
  {
    id: 5,
    description: 'Belanja Mingguan',
    category_name: 'Kebutuhan Pokok',
    type: 'expense',
    wallet_name: 'Rekening Utama',
    wallet_id: 1,
    amount: 195002,
    tax_amount: 0,
    date: '2026-10-10',
  },
  {
    id: 6,
    description: 'Gaji Bulanan',
    category_name: 'Gaji',
    type: 'income',
    wallet_name: 'Rekening Utama',
    wallet_id: 1,
    amount: 1101200,
    tax_amount: 0,
    date: '2026-10-01',
  },
];

// Helper to generate local fallback id
const generateFallbackId = () => Date.now();

export default function Transactions() {
  const { authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);

  // Toast / alert feedback
  const [toastMessage, setToastMessage] = useState('');

  // Filters state
  const [filter, setFilter] = useState({
    type: '',
    category_id: '',
    wallet_id: '',
    search: '',
    taxOnly: '',
  });

  // Create form state
  const [form, setForm] = useState({
    wallet_id: '',
    category_id: '',
    amount: '',
    hasTax: false,
    taxType: 'fixed', // 'fixed' | 'percent'
    taxAmount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: null,
    wallet_id: '',
    category_id: '',
    amount: '',
    hasTax: false,
    taxType: 'fixed',
    taxAmount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editFormError, setEditFormError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Toast auto-hide
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Calculations for Add Form
  const baseAmount = parseFloat(form.amount) || 0;
  let calculatedTax = 0;
  if (form.hasTax) {
    if (form.taxType === 'fixed') {
      calculatedTax = Math.max(0, parseFloat(form.taxAmount || 0));
    } else {
      const pct = Math.max(0, parseFloat(form.taxAmount || 0));
      calculatedTax = Math.round((baseAmount * pct) / 100);
    }
  }
  const finalTotal = baseAmount + calculatedTax;

  // Calculations for Edit Form
  const editBaseAmount = parseFloat(editForm.amount) || 0;
  let editCalculatedTax = 0;
  if (editForm.hasTax) {
    if (editForm.taxType === 'fixed') {
      editCalculatedTax = Math.max(0, parseFloat(editForm.taxAmount || 0));
    } else {
      const pct = Math.max(0, parseFloat(editForm.taxAmount || 0));
      editCalculatedTax = Math.round((editBaseAmount * pct) / 100);
    }
  }
  const editFinalTotal = editBaseAmount + editCalculatedTax;

  // Load data from backend API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set('type', filter.type);
      if (filter.category_id) params.set('category_id', filter.category_id);
      if (filter.wallet_id) params.set('wallet_id', filter.wallet_id);
      if (filter.search) params.set('search', filter.search);
      params.set('limit', '100');

      if (authFetch) {
        const [txRes, catRes, walRes] = await Promise.all([
          authFetch(`/api/transactions?${params}`),
          authFetch('/api/categories'),
          authFetch('/api/wallets'),
        ]);

        let hasData = false;
        if (txRes && txRes.ok) {
          const txData = await txRes.json();
          if (Array.isArray(txData) && txData.length > 0) {
            setTransactions(txData);
            checkAndSendDailyReminder(txData);
            hasData = true;
          }
        }
        if (!hasData) {
          setTransactions(DEFAULT_TRANSACTIONS);
        }

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
        if (walRes && walRes.ok) {
          const walData = await walRes.json();
          setWallets(walData);
          if (walData.length > 0 && !form.wallet_id) {
            setForm((f) => ({ ...f, wallet_id: walData[0].id }));
          }
        }
      } else {
        setTransactions(DEFAULT_TRANSACTIONS);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setTransactions(DEFAULT_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Form submission: Add Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.wallet_id && wallets.length > 0) {
      return setFormError('Pilih dompet tujuan');
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      return setFormError('Masukkan jumlah nominal valid');
    }

    setSaving(true);
    try {
      if (getNotificationPermission() === 'default') {
        await requestNotificationPermission();
      }

      if (authFetch) {
        const res = await authFetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            wallet_id: form.wallet_id || (wallets[0]?.id || 1),
            category_id: form.category_id || null,
            amount: finalTotal,
            tax_amount: calculatedTax,
            type: form.type,
            description: form.description,
            date: form.date,
          }),
        });

        if (res.ok) {
          const categoryObj = categories.find((c) => String(c.id) === String(form.category_id));
          await notifyTransactionCreated({
            type: form.type,
            amount: finalTotal,
            categoryName: categoryObj?.name || form.description,
            existingTransactions: transactions,
            date: form.date,
          });

          setShowModal(false);
          setForm({
            wallet_id: wallets[0]?.id || '',
            category_id: '',
            amount: '',
            hasTax: false,
            taxType: 'fixed',
            taxAmount: '',
            type: 'expense',
            description: '',
            date: new Date().toISOString().split('T')[0],
          });
          triggerToast('Transaksi berhasil dicatat!');
          loadData();
          return;
        }
      }

      // Fallback local addition if API offline
      const newTx = {
        id: generateFallbackId(),
        wallet_id: form.wallet_id || 1,
        wallet_name: wallets.find((w) => String(w.id) === String(form.wallet_id))?.name || 'Rekening Utama',
        category_id: form.category_id || null,
        category_name: categories.find((c) => String(c.id) === String(form.category_id))?.name || (form.type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
        amount: finalTotal,
        tax_amount: calculatedTax,
        type: form.type,
        description: form.description || 'Transaksi baru',
        date: form.date,
      };
      setTransactions((prev) => [newTx, ...prev]);
      setShowModal(false);
      triggerToast('Transaksi berhasil dicatat!');
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (tx) => {
    const taxVal = parseFloat(tx.tax_amount || 0);
    const hasTax = taxVal > 0;
    const baseVal = Math.max(0, parseFloat(tx.amount) - taxVal);

    let rawDate = new Date().toISOString().split('T')[0];
    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        rawDate = d.toISOString().split('T')[0];
      }
    }

    setEditForm({
      id: tx.id,
      wallet_id: tx.wallet_id || (wallets[0]?.id || 1),
      category_id: tx.category_id || '',
      amount: String(baseVal),
      hasTax: hasTax,
      taxType: 'fixed',
      taxAmount: hasTax ? String(taxVal) : '',
      type: tx.type || 'expense',
      description: tx.description || '',
      date: rawDate,
    });
    setEditFormError('');
    setShowEditModal(true);
  };

  // Form submission: Update Transaction
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');

    if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
      return setEditFormError('Masukkan jumlah nominal valid');
    }

    setEditSaving(true);
    try {
      if (authFetch) {
        const res = await authFetch(`/api/transactions/${editForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            wallet_id: editForm.wallet_id,
            category_id: editForm.category_id || null,
            amount: editFinalTotal,
            tax_amount: editCalculatedTax,
            type: editForm.type,
            description: editForm.description,
            date: editForm.date,
          }),
        });

        if (res.ok) {
          setShowEditModal(false);
          triggerToast('Transaksi berhasil diperbarui!');
          loadData();
          return;
        }
      }

      // Fallback local update
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editForm.id
            ? {
                ...t,
                wallet_id: editForm.wallet_id,
                wallet_name: wallets.find((w) => String(w.id) === String(editForm.wallet_id))?.name || t.wallet_name,
                category_id: editForm.category_id,
                category_name: categories.find((c) => String(c.id) === String(editForm.category_id))?.name || t.category_name,
                amount: editFinalTotal,
                tax_amount: editCalculatedTax,
                type: editForm.type,
                description: editForm.description,
                date: editForm.date,
              }
            : t
        )
      );
      setShowEditModal(false);
      triggerToast('Transaksi berhasil diperbarui!');
    } catch (err) {
      setEditFormError(err.message || 'Terjadi kesalahan saat memperbarui');
    } finally {
      setEditSaving(false);
    }
  };

  // Delete transaction handler
  const confirmDelete = async () => {
    if (!deletingTx) return;
    try {
      if (authFetch) {
        const res = await authFetch(`/api/transactions/${deletingTx.id}`, { method: 'DELETE' });
        if (res.ok) {
          setDeletingTx(null);
          triggerToast('Transaksi berhasil dihapus');
          loadData();
          return;
        }
      }
      setTransactions((prev) => prev.filter((t) => t.id !== deletingTx.id));
      setDeletingTx(null);
      triggerToast('Transaksi berhasil dihapus');
    } catch {
      triggerToast('Gagal menghapus transaksi');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Dompet', 'Jenis', 'Jumlah', 'Pajak_Fee'];
    const rows = transactions.map((t) => [
      t.date || '',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.category_name || '').replace(/"/g, '""')}"`,
      `"${(t.wallet_name || '').replace(/"/g, '""')}"`,
      t.type || '',
      parseFloat(t.amount || 0),
      parseFloat(t.tax_amount || 0),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('File CSV berhasil diunduh!');
  };

  // Calculations for summary stats
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const totalTax = transactions.reduce((s, t) => s + parseFloat(t.tax_amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Filter display transactions
  const displayTransactions = transactions.filter((t) => {
    if (filter.type && t.type !== filter.type) return false;
    if (filter.wallet_id && String(t.wallet_id) !== String(filter.wallet_id)) return false;
    if (filter.category_id && String(t.category_id) !== String(filter.category_id)) return false;
    if (filter.taxOnly === 'with_tax' && parseFloat(t.tax_amount || 0) <= 0) return false;
    if (filter.taxOnly === 'without_tax' && parseFloat(t.tax_amount || 0) > 0) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchCat = (t.category_name || '').toLowerCase().includes(q);
      const matchWal = (t.wallet_name || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchWal) return false;
    }
    return true;
  });

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const editFilteredCategories = categories.filter((c) => c.type === editForm.type);

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
          <span className="font-semibold text-[#191B3D] dark:text-white">Transaksi</span>
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
          <span>Ruang personal · Transaksi</span>
          <span>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        {/* ===================================================================== */}
        {/* ROW 1: HEADER & ACTION BUTTONS                                        */}
        {/* ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl md:text-[26px] font-extrabold text-[#191B3D] dark:text-white tracking-tight">
            Transaksi
          </h1>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 text-[#61647C] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800/60 shadow-2xs transition-all cursor-pointer"
              title="Export transaksi ke CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (wallets.length > 0 && !form.wallet_id) {
                  setForm((f) => ({ ...f, wallet_id: wallets[0].id }));
                }
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 2: 4 SUMMARY CARDS (Responsive Grid)                               */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: TOTAL PEMASUKAN (Lavender Accent) */}
          <div className="bg-[#E7E7F4] dark:bg-[#1C2035] border border-[#DFE5EE] dark:border-indigo-950/50 rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[110px] transition-all">
            <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
              TOTAL PEMASUKAN
            </span>
            <div className="text-2xl md:text-[26px] font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalIncome)}
            </div>
            <span className="text-xs text-[#61647C] dark:text-slate-400">
              Catatan pemasukan
            </span>
          </div>

          {/* Card 2: TOTAL PENGELUARAN */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[110px] transition-all">
            <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
              TOTAL PENGELUARAN
            </span>
            <div className="text-2xl md:text-[26px] font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalExpense)}
            </div>
            <span className="text-xs text-[#94A3B8] dark:text-slate-400">
              Keseluruhan pengeluaran
            </span>
          </div>

          {/* Card 3: PAJAK & BIAYA ADMIN (Clickable Filter) */}
          <div
            onClick={() => setFilter((f) => ({ ...f, taxOnly: f.taxOnly === 'with_tax' ? '' : 'with_tax' }))}
            className={`bg-white dark:bg-[#141721] border rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[110px] cursor-pointer transition-all ${
              filter.taxOnly === 'with_tax'
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-[#DFE5EE] dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700'
            }`}
            title="Klik untuk menyaring transaksi berpajak atau biaya admin"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
                PAJAK &amp; BIAYA ADMIN
              </span>
              {filter.taxOnly === 'with_tax' && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded-md">
                  Aktif
                </span>
              )}
            </div>
            <div className="text-2xl md:text-[26px] font-extrabold text-[#191B3D] dark:text-white my-1 tracking-tight">
              {formatAmount(totalTax)}
            </div>
            <span className="text-xs text-[#94A3B8] dark:text-slate-400 flex items-center gap-1">
              <span>{transactions.filter((t) => parseFloat(t.tax_amount || 0) > 0).length} transaksi berpajak/fee</span>
              {filter.taxOnly === 'with_tax' && <span className="text-amber-500 font-bold">✓</span>}
            </span>
          </div>

          {/* Card 4: SELISIH ARUS KAS */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xs min-h-[110px] transition-all">
            <span className="text-[11px] font-bold tracking-wider text-[#61647C] dark:text-slate-400 uppercase">
              SELISIH ARUS KAS
            </span>
            <div className={`text-2xl md:text-[26px] font-extrabold my-1 tracking-tight ${netBalance >= 0 ? 'text-[#191B3D] dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatAmount(netBalance)}
            </div>
            <span className="text-xs text-[#94A3B8] dark:text-slate-400">
              {netBalance >= 0 ? 'Arus kas positif' : 'Arus kas defisit'}
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 3: MAIN CARD — DAFTAR TRANSAKSI                                   */}
        {/* ===================================================================== */}
        <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-base font-bold text-[#191B3D] dark:text-white">
              Daftar transaksi
            </h2>
            <span className="text-xs text-[#7F8A9E] dark:text-slate-400">
              Menampilkan {displayTransactions.length} dari {transactions.length} transaksi
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Cari keterangan, kategori, atau dompet..."
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              className="w-full h-10.5 pl-10 pr-9 rounded-xl text-xs md:text-sm bg-[#F2F3F8] dark:bg-[#0d0f18] border border-transparent dark:border-gray-800 text-[#191B3D] dark:text-white placeholder-[#94A3B8] focus:border-indigo-500 focus:bg-white dark:focus:bg-[#10121d] focus:outline-none transition-all"
            />
            {filter.search && (
              <button
                type="button"
                onClick={() => setFilter((f) => ({ ...f, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#191B3D] dark:hover:text-white"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills & Selects */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setFilter((f) => ({ ...f, type: '', taxOnly: '' }))}
              className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                filter.type === '' && filter.taxOnly !== 'with_tax'
                  ? 'bg-[#191B3D] text-white border-[#191B3D] dark:bg-indigo-600 dark:border-indigo-600'
                  : 'bg-slate-50 dark:bg-gray-800/40 text-[#61647C] dark:text-slate-300 border-[#DFE5EE] dark:border-gray-700 hover:border-slate-400'
              }`}
            >
              Semua Transaksi
            </button>

            <button
              type="button"
              onClick={() => setFilter((f) => ({ ...f, type: 'income', taxOnly: '' }))}
              className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                filter.type === 'income'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-gray-800/40 text-[#61647C] dark:text-slate-300 border-[#DFE5EE] dark:border-gray-700 hover:border-slate-400'
              }`}
            >
              Pemasukan
            </button>

            <button
              type="button"
              onClick={() => setFilter((f) => ({ ...f, type: 'expense', taxOnly: '' }))}
              className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                filter.type === 'expense'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 dark:bg-gray-800/40 text-[#61647C] dark:text-slate-300 border-[#DFE5EE] dark:border-gray-700 hover:border-slate-400'
              }`}
            >
              Pengeluaran
            </button>

            <button
              type="button"
              onClick={() => setFilter((f) => ({ ...f, taxOnly: f.taxOnly === 'with_tax' ? '' : 'with_tax' }))}
              className={`px-3.5 py-1.5 rounded-full font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                filter.taxOnly === 'with_tax'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-50 dark:bg-gray-800/40 text-[#61647C] dark:text-slate-300 border-[#DFE5EE] dark:border-gray-700 hover:border-slate-400'
              }`}
            >
              <span>Ada Pajak/Fee</span>
              {filter.taxOnly === 'with_tax' && <X className="w-3.5 h-3.5" />}
            </button>

            {/* Wallet Dropdown */}
            <div className="relative">
              <select
                value={filter.wallet_id}
                onChange={(e) => setFilter((f) => ({ ...f, wallet_id: e.target.value }))}
                className={`appearance-none pl-3 pr-7 py-1.5 rounded-full font-semibold border transition-all cursor-pointer text-xs focus:outline-none ${
                  filter.wallet_id
                    ? 'bg-[#191B3D] text-white border-[#191B3D] dark:bg-indigo-600 dark:border-indigo-600'
                    : 'bg-slate-50 dark:bg-gray-800/40 text-[#61647C] dark:text-slate-300 border-[#DFE5EE] dark:border-gray-700'
                }`}
              >
                <option value="" className="bg-white dark:bg-gray-900 text-slate-800 dark:text-white">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-white dark:bg-gray-900 text-slate-800 dark:text-white">
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={filter.category_id}
                onChange={(e) => setFilter((f) => ({ ...f, category_id: e.target.value }))}
                className={`appearance-none pl-3 pr-7 py-1.5 rounded-full font-semibold border transition-all cursor-pointer text-xs focus:outline-none ${
                  filter.category_id
                    ? 'bg-[#191B3D] text-white border-[#191B3D] dark:bg-indigo-600 dark:border-indigo-600'
                    : 'bg-slate-50 dark:bg-gray-800/40 text-[#61647C] dark:text-slate-300 border-[#DFE5EE] dark:border-gray-700'
                }`}
              >
                <option value="" className="bg-white dark:bg-gray-900 text-slate-800 dark:text-white">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-gray-900 text-slate-800 dark:text-white">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>

            {/* Reset Filter Button */}
            {(filter.type || filter.category_id || filter.wallet_id || filter.search || filter.taxOnly) && (
              <button
                type="button"
                onClick={() => setFilter({ type: '', category_id: '', wallet_id: '', search: '', taxOnly: '' })}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* =================================================================== */}
          {/* TRANSACTIONS LIST: TABLE (DESKTOP/TABLET) & CARDS (MOBILE)           */}
          {/* =================================================================== */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400">Memuat catatan transaksi...</p>
            </div>
          ) : displayTransactions.length > 0 ? (
            <>
              {/* DESKTOP & TABLET VIEW (TABLE) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DFE5EE] dark:border-gray-800 text-[11px] font-bold text-[#7F8A9E] dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">KATEGORI &amp; KETERANGAN</th>
                      <th className="py-3 px-3">DOMPET</th>
                      <th className="py-3 px-3">TANGGAL</th>
                      <th className="py-3 px-3">NOMINAL &amp; RINCIAN</th>
                      <th className="py-3 px-3 text-center w-24">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
                    {displayTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const taxVal = parseFloat(tx.tax_amount || 0);
                      const hasTax = taxVal > 0;
                      const baseVal = Math.max(0, parseFloat(tx.amount || 0) - taxVal);

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          {/* Col 1: Kategori & Keterangan */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-sm text-[#191B3D] dark:text-white">
                              {tx.description || tx.category_name || 'Transaksi'}
                            </div>
                            <div className="text-xs text-[#7F8A9E] dark:text-slate-400">
                              {tx.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                            </div>
                          </td>

                          {/* Col 2: Dompet */}
                          <td className="py-3.5 px-3 text-xs font-semibold text-[#475569] dark:text-slate-300">
                            {tx.wallet_name || 'Rekening Utama'}
                          </td>

                          {/* Col 3: Tanggal */}
                          <td className="py-3.5 px-3 text-xs text-[#64748B] dark:text-slate-400">
                            {formatDateShort(tx.date)}
                          </td>

                          {/* Col 4: Nominal & Rincian */}
                          <td className="py-3.5 px-3">
                            <div
                              className={`font-extrabold text-sm ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#191B3D] dark:text-white'
                              }`}
                            >
                              {isIncome ? '+ ' : '- '}
                              {formatAmount(tx.amount)}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] dark:text-slate-400">
                              {hasTax ? (
                                <span>
                                  Pokok: {formatAmount(baseVal)} • Pajak/Fee: +{formatAmount(taxVal)}
                                </span>
                              ) : (
                                <span>Tanpa biaya tambahan</span>
                              )}
                            </div>
                          </td>

                          {/* Col 5: Aksi */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(tx)}
                                className="w-8 h-8 rounded-lg border border-[#DFE5EE] dark:border-gray-800 text-[#64748B] dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 flex items-center justify-center transition-all cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTx(tx)}
                                className="w-8 h-8 rounded-lg border border-[#DFE5EE] dark:border-gray-800 text-[#64748B] dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 flex items-center justify-center transition-all cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW (CARD STACK) */}
              <div className="md:hidden space-y-3">
                {displayTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const taxVal = parseFloat(tx.tax_amount || 0);

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-[#F8FAFC]/50 dark:bg-gray-800/30 space-y-2.5"
                    >
                      {/* Top Row: Description & Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[#191B3D] dark:text-white leading-tight">
                            {tx.description || tx.category_name || 'Transaksi'}
                          </div>
                          <div className="text-xs text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                            {tx.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                          </div>
                        </div>

                        <div
                          className={`font-extrabold text-sm whitespace-nowrap ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#191B3D] dark:text-white'
                          }`}
                        >
                          {isIncome ? '+ ' : '- '}
                          {formatAmount(tx.amount)}
                        </div>
                      </div>

                      {/* Middle Row: Wallet & Date */}
                      <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-gray-800/60">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Dompet:</span>
                          <span className="font-bold text-[#191B3D] dark:text-slate-200">
                            {tx.wallet_name || 'Rekening Utama'}
                          </span>
                        </div>
                        <div>{formatDateShort(tx.date)}</div>
                      </div>

                      {/* Tax info if present */}
                      {taxVal > 0 && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Termasuk pajak/fee: +{formatAmount(taxVal)}
                        </div>
                      )}

                      {/* Bottom Row: Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-gray-800/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700/60 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTx(tx)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between pt-2 text-xs text-[#7F8A9E] dark:text-slate-400 border-t border-[#DFE5EE] dark:border-gray-800">
                <span>
                  Menampilkan {displayTransactions.length} dari {transactions.length} transaksi
                </span>
                <Link
                  to="/laporan"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka Laporan</span>
                  <span>→</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-12 h-12 text-[#94A3B8] mx-auto opacity-70" />
              <div className="font-bold text-sm text-[#191B3D] dark:text-white">
                {transactions.length > 0 ? 'Tidak ada transaksi yang cocok' : 'Belum ada riwayat transaksi'}
              </div>
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400 max-w-sm mx-auto">
                {transactions.length > 0
                  ? 'Coba atur ulang kata kunci pencarian atau filter tipe transaksi Anda.'
                  : 'Klik tombol "+ Catat Transaksi" untuk memasukkan catatan pengeluaran atau pemasukan baru.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================================= */}
      {/* MODAL: CATAT TRANSAKSI BARU                                             */}
      {/* ======================================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-[#141721] rounded-2xl border border-[#DFE5EE] dark:border-gray-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 ${
                    form.type === 'income'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : form.type === 'transfer'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {form.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : form.type === 'transfer' ? <ArrowLeftRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                  <span>{form.type === 'income' ? 'Pemasukan' : form.type === 'transfer' ? 'Transfer' : 'Pengeluaran'}</span>
                </span>
                <h3 className="text-lg font-extrabold text-[#191B3D] dark:text-white">
                  Catat Transaksi Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type Selector (3 tabs) */}
              <div className="grid grid-cols-3 gap-1 bg-[#F2F3F8] dark:bg-[#0d0f18] p-1 rounded-xl border border-[#DFE5EE] dark:border-gray-800">
                {[
                  { key: 'expense', label: 'Pengeluaran' },
                  { key: 'income', label: 'Pemasukan' },
                  { key: 'transfer', label: 'Transfer' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.key, category_id: '' }))}
                    className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      form.type === t.key
                        ? t.key === 'income'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : t.key === 'expense'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-[#191B3D] dark:bg-indigo-600 text-white shadow-xs'
                        : 'text-[#61647C] dark:text-slate-400 hover:text-[#191B3D] dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Nominal Input Box */}
              <div className="bg-[#F8FAFC] dark:bg-[#10121d] border border-[#DFE5EE] dark:border-gray-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#7F8A9E] dark:text-slate-400">
                  <span>NOMINAL (RP)</span>
                  {parseFloat(form.amount) > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, amount: '' }))}
                      className="text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#94A3B8]">Rp</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    required
                    className="w-full bg-transparent text-2xl font-extrabold text-[#191B3D] dark:text-white outline-none tracking-tight"
                  />
                </div>

                {/* Quick Add Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '+10 rb', val: 10000 },
                    { label: '+20 rb', val: 20000 },
                    { label: '+50 rb', val: 50000 },
                    { label: '+100 rb', val: 100000 },
                    { label: '+500 rb', val: 500000 },
                    { label: '+1 jt', val: 1000000 },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          amount: String((parseFloat(f.amount) || 0) + chip.val),
                        }))
                      }
                      className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-[#DFE5EE] dark:border-gray-700 text-[#475569] dark:text-slate-300 text-[11px] font-semibold hover:border-indigo-400 transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dompet & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Pilih Dompet *
                  </label>
                  <select
                    value={form.wallet_id}
                    onChange={(e) => setForm((f) => ({ ...f, wallet_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Pilih Dompet</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tax / Admin Fee Toggle */}
              <div className="p-3 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-[#F8FAFC]/50 dark:bg-gray-800/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#475569] dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.hasTax}
                    onChange={(e) => setForm((f) => ({ ...f, hasTax: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span>Ada Pajak atau Biaya Admin (Fee)?</span>
                </label>

                {form.hasTax && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                    <select
                      value={form.taxType}
                      onChange={(e) => setForm((f) => ({ ...f, taxType: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-xs text-[#191B3D] dark:text-white"
                    >
                      <option value="fixed">Nominal Tetap (Rp)</option>
                      <option value="percent">Persentase (%)</option>
                    </select>
                    <input
                      type="number"
                      placeholder={form.taxType === 'fixed' ? 'Nominal fee (Rp)' : 'Persentase (%)'}
                      value={form.taxAmount}
                      onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-xs text-[#191B3D] dark:text-white outline-none"
                    />
                    <div className="col-span-2 text-[11px] text-[#7F8A9E] dark:text-slate-400">
                      Total akhir: <strong className="text-[#191B3D] dark:text-white">{formatRupiah(finalTotal)}</strong> (termasuk biaya {formatRupiah(calculatedTax)})
                    </div>
                  </div>
                )}
              </div>

              {/* Keterangan / Deskripsi */}
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Makan siang nasi padang, beli token listrik..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: EDIT TRANSAKSI                                                   */}
      {/* ======================================================================= */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white dark:bg-[#141721] rounded-2xl border border-[#DFE5EE] dark:border-gray-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#191B3D] dark:text-white">
                  Edit Transaksi
                </h3>
                <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                  Ubah rincian transaksi terpilih
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full border border-[#DFE5EE] dark:border-gray-700 flex items-center justify-center text-[#64748B] hover:text-[#191B3D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              {/* Type Selector (3 tabs) */}
              <div className="grid grid-cols-3 gap-1 bg-[#F2F3F8] dark:bg-[#0d0f18] p-1 rounded-xl border border-[#DFE5EE] dark:border-gray-800">
                {[
                  { key: 'expense', label: 'Pengeluaran' },
                  { key: 'income', label: 'Pemasukan' },
                  { key: 'transfer', label: 'Transfer' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, type: t.key, category_id: '' }))}
                    className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      editForm.type === t.key
                        ? editForm.type === 'income'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : editForm.type === 'expense'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-[#191B3D] dark:bg-indigo-600 text-white shadow-xs'
                        : 'text-[#61647C] dark:text-slate-400 hover:text-[#191B3D] dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Nominal Input Box */}
              <div className="bg-[#F8FAFC] dark:bg-[#10121d] border border-[#DFE5EE] dark:border-gray-800 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-[#7F8A9E] dark:text-slate-400">
                  NOMINAL (RP)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#94A3B8]">Rp</span>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    required
                    className="w-full bg-transparent text-2xl font-extrabold text-[#191B3D] dark:text-white outline-none tracking-tight"
                  />
                </div>
              </div>

              {/* Dompet & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Pilih Dompet *
                  </label>
                  <select
                    value={editForm.wallet_id}
                    onChange={(e) => setEditForm((f) => ({ ...f, wallet_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Pilih Dompet</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {editFilteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tax / Admin Fee Toggle */}
              <div className="p-3 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-[#F8FAFC]/50 dark:bg-gray-800/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#475569] dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editForm.hasTax}
                    onChange={(e) => setEditForm((f) => ({ ...f, hasTax: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span>Ada Pajak atau Biaya Admin (Fee)?</span>
                </label>

                {editForm.hasTax && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                    <select
                      value={editForm.taxType}
                      onChange={(e) => setEditForm((f) => ({ ...f, taxType: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-xs text-[#191B3D] dark:text-white"
                    >
                      <option value="fixed">Nominal Tetap (Rp)</option>
                      <option value="percent">Persentase (%)</option>
                    </select>
                    <input
                      type="number"
                      placeholder={editForm.taxType === 'fixed' ? 'Nominal fee (Rp)' : 'Persentase (%)'}
                      value={editForm.taxAmount}
                      onChange={(e) => setEditForm((f) => ({ ...f, taxAmount: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-xs text-[#191B3D] dark:text-white outline-none"
                    />
                    <div className="col-span-2 text-[11px] text-[#7F8A9E] dark:text-slate-400">
                      Total akhir: <strong className="text-[#191B3D] dark:text-white">{formatRupiah(editFinalTotal)}</strong> (termasuk biaya {formatRupiah(editCalculatedTax)})
                    </div>
                  </div>
                )}
              </div>

              {/* Keterangan */}
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border border-[#DFE5EE] dark:border-gray-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? 'Menyimpan...' : 'Perbarui Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS                                                 */}
      {/* ======================================================================= */}
      {deletingTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setDeletingTx(null)}
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
                Hapus Transaksi?
              </h4>
              <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                Apakah Anda yakin ingin menghapus catatan{' '}
                <strong className="text-[#191B3D] dark:text-white">
                  &quot;{deletingTx.description || deletingTx.category_name || 'Transaksi'}&quot;
                </strong>{' '}
                senilai{' '}
                <strong className="text-[#191B3D] dark:text-white">
                  {formatRupiah(deletingTx.amount)}
                </strong>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
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
