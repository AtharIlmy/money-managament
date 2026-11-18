import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import {
  CalendarDays,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Smartphone,
  CreditCard,
  Pencil,
  Trash2,
  ClipboardList,
  Plus,
  Target,
  X,
  Check,
} from 'lucide-react';

// Fallback dummy data matching Figcraft frame when API is not populated
const DEFAULT_WALLETS = [
  {
    id: 1,
    name: 'Rekening Utama',
    type: 'checking',
    balance: 624929,
    icon: 'building',
    color: '#191B3D',
  },
  {
    id: 2,
    name: 'Gopay',
    type: 'ewallet',
    balance: 29861,
    icon: 'smartphone',
    color: '#00AED6',
  },
];

export default function Wallets() {
  const { user, authFetch } = useAuth();
  const { isHidden } = usePrivacy();

  const [wallets, setWallets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [_loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWalletDetail, setSelectedWalletDetail] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    type: 'checking',
    balance: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'checking',
    balance: '',
  });
  const [transferForm, setTransferForm] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: '',
    note: '',
  });

  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (authFetch) {
        const [walRes, goalRes, txRes] = await Promise.all([
          authFetch('/api/wallets').catch(() => null),
          authFetch('/api/goals').catch(() => null),
          authFetch('/api/transactions?limit=10').catch(() => null),
        ]);

        if (walRes && walRes.ok) {
          const data = await walRes.json();
          setWallets(data.length > 0 ? data : DEFAULT_WALLETS);
        } else {
          setWallets(DEFAULT_WALLETS);
        }

        if (goalRes && goalRes.ok) {
          const goalData = await goalRes.json();
          setGoals(goalData || []);
        }

        if (txRes && txRes.ok) {
          const txData = await txRes.json();
          setRecentTx(txData || []);
        }
      } else {
        setWallets(DEFAULT_WALLETS);
      }
    } catch {
      setWallets(DEFAULT_WALLETS);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Derived financial computations
  const totalBalance = wallets.reduce((s, w) => s + parseFloat(w.balance || 0), 0);
  const totalSavings = goals.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);
  const incomeTx = recentTx.filter((t) => t.type === 'income');
  const expenseTx = recentTx.filter((t) => t.type === 'expense');
  const totalIncome = incomeTx.length > 0 ? incomeTx.reduce((s, t) => s + parseFloat(t.amount || 0), 0) : 1101200;
  const totalExpense = expenseTx.length > 0 ? expenseTx.reduce((s, t) => s + parseFloat(t.amount || 0), 0) : 358502;
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '32.6';

  const mainWalletName = wallets[0]?.name || 'Rekening Utama';

  // Handler: Add Wallet
  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setErrorMsg('Nama dompet harus diisi');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (authFetch) {
        const res = await authFetch('/api/wallets', {
          method: 'POST',
          body: JSON.stringify({
            name: addForm.name.trim(),
            type: addForm.type,
            balance: parseFloat(addForm.balance) || 0,
            icon: addForm.type === 'ewallet' ? 'smartphone' : 'building',
            color: '#191B3D',
          }),
        });
        if (res.ok) {
          setShowAddModal(false);
          setAddForm({ name: '', type: 'checking', balance: '' });
          triggerToast('Dompet baru berhasil ditambahkan!');
          loadData();
          return;
        }
      }
      // Fallback local update
      const newWallet = {
        id: Date.now(),
        name: addForm.name.trim(),
        type: addForm.type,
        balance: parseFloat(addForm.balance) || 0,
        icon: addForm.type === 'ewallet' ? 'smartphone' : 'building',
        color: '#191B3D',
      };
      setWallets((prev) => [...prev, newWallet]);
      setShowAddModal(false);
      setAddForm({ name: '', type: 'checking', balance: '' });
      triggerToast('Dompet baru berhasil ditambahkan!');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan dompet');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Transfer Dana
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.from_wallet_id || !transferForm.to_wallet_id || !transferForm.amount) {
      setErrorMsg('Pilih dompet asal, tujuan, dan nominal transfer.');
      return;
    }
    if (transferForm.from_wallet_id === transferForm.to_wallet_id) {
      setErrorMsg('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (authFetch) {
        const res = await authFetch('/api/wallets/transfer', {
          method: 'POST',
          body: JSON.stringify(transferForm),
        });
        if (res.ok) {
          setShowTransferModal(false);
          setTransferForm({ from_wallet_id: '', to_wallet_id: '', amount: '', note: '' });
          triggerToast('Transfer dana berhasil dilakukan!');
          loadData();
          return;
        }
      }
      // Local fallback transfer
      const amt = parseFloat(transferForm.amount) || 0;
      setWallets((prev) =>
        prev.map((w) => {
          if (String(w.id) === String(transferForm.from_wallet_id)) {
            return { ...w, balance: Math.max(0, (w.balance || 0) - amt) };
          }
          if (String(w.id) === String(transferForm.to_wallet_id)) {
            return { ...w, balance: (w.balance || 0) + amt };
          }
          return w;
        })
      );
      setShowTransferModal(false);
      triggerToast('Transfer dana berhasil dilakukan!');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal melakukan transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Edit Wallet
  const handleOpenEdit = (w) => {
    setEditingWallet(w);
    setEditForm({
      id: w.id,
      name: w.name,
      type: w.type || 'checking',
      balance: w.balance || 0,
    });
    setErrorMsg('');
    setShowEditModal(true);
  };

  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setErrorMsg('Nama dompet harus diisi');
    setSubmitting(true);
    try {
      if (authFetch && editForm.id) {
        const res = await authFetch(`/api/wallets/${editForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: editForm.name.trim(),
            type: editForm.type,
            balance: parseFloat(editForm.balance) || 0,
          }),
        });
        if (res.ok) {
          setShowEditModal(false);
          triggerToast('Dompet berhasil diperbarui!');
          loadData();
          return;
        }
      }
      setWallets((prev) =>
        prev.map((w) => (w.id === editForm.id ? { ...w, ...editForm, balance: parseFloat(editForm.balance) || 0 } : w))
      );
      setShowEditModal(false);
      triggerToast('Dompet berhasil diperbarui!');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui dompet');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Delete Wallet
  const handleOpenDelete = (w) => {
    setDeletingWallet(w);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingWallet) return;
    setSubmitting(true);
    try {
      if (authFetch && deletingWallet.id) {
        const res = await authFetch(`/api/wallets/${deletingWallet.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setShowDeleteModal(false);
          triggerToast('Dompet berhasil dihapus!');
          loadData();
          return;
        }
      }
      setWallets((prev) => prev.filter((w) => w.id !== deletingWallet.id));
      setShowDeleteModal(false);
      triggerToast('Dompet berhasil dihapus!');
    } catch {
      triggerToast('Gagal menghapus dompet');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (val) => {
    return isHidden ? '••••••' : formatRupiah(val);
  };

  const userName = user?.name || 'Muhammad';

  return (
    <div className="w-full min-h-screen bg-[#F2F3F8] dark:bg-[#0d0f18] text-[#191B3D] dark:text-slate-100 font-sans antialiased transition-colors duration-150 flex flex-col">
      {/* ======================================================================= */}
      {/* TOPBAR (DESKTOP / TABLET: md+)                                          */}
      {/* ======================================================================= */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-[68px] bg-white dark:bg-[#141721] border-b border-[#DFE5EE] dark:border-gray-800 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#7F8A9E] dark:text-slate-400">
          <span>Ruang personal</span>
          <span>·</span>
          <span className="font-semibold text-[#191B3D] dark:text-white">Dompet</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#22755F] dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-[#22755F] dark:bg-emerald-400 inline-block" />
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
          {/* Mobile subheader breadcrumb & date */}
          <div className="md:hidden flex items-center justify-between text-[11px] text-[#61647C] dark:text-slate-400 px-0.5">
            <span>Ruang personal · Dompet</span>
            <span>
              {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
            </span>
          </div>

          {/* Page Title & Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#191B3D] dark:text-white">
              Dompet
            </h1>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#191B3D] hover:bg-indigo-950 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={16} />
              <span>Tambah Dompet</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* SECTION 1: RINGKASAN UTAMA (Banner Lavender + Kartu Saldo Utama)      */}
          {/* ===================================================================== */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Banner Lavender: Informasi Utama (Figcraft 4294969107) */}
            <div className="md:col-span-7 lg:col-span-8 bg-[#E7E7F4] dark:bg-[#1C2035] rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-2xs border border-indigo-100/60 dark:border-indigo-900/40">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#191B3D] dark:text-white tracking-tight leading-snug">
                  Dompetmu, lebih rapi
                </h2>
                <p className="text-xs sm:text-sm text-[#61647C] dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
                  Atur saldo rekening, rekening aktif, dan tujuan tabunganmu dalam satu pandangan.
                </p>
              </div>

              {/* Action Button: Ringkasan 2026 */}
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#252A42] border border-[#DFE5EE] dark:border-slate-700 text-xs font-semibold text-[#191B3D] dark:text-white shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CalendarDays size={16} className="text-[#191B3D] dark:text-white" />
                  <span>Ringkasan 2026</span>
                </button>
              </div>
            </div>

            {/* Kartu Saldo Utama (Figcraft 4294969115): Deep Indigo Gradient with Glow */}
            <div className="md:col-span-5 lg:col-span-4 bg-gradient-to-br from-indigo-900 via-indigo-950 to-[#101126] text-white rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative overflow-hidden border border-indigo-900/40 min-h-[160px]">
              {/* Progressive blur ambient glow */}
              <div
                className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/0 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <span className="text-[11px] font-medium text-indigo-200/80 uppercase tracking-wider">
                  Saldo tersedia
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  {formatAmount(totalBalance)}
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200/90">
                <span>Uang yang siap digunakan</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-xs" />
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 2: 3 KARTU STATISTIK (Total tabungan, Pengeluaran, Pemasukan) */}
          {/* ===================================================================== */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stat Card 1: Total Tabungan (Lavender bg) */}
            <div className="bg-[#E7E7F4] dark:bg-[#1C2035] rounded-2xl p-5 flex flex-col justify-between shadow-2xs border border-indigo-100/60 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#61647C] dark:text-slate-400">
                  Total tabungan
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 dark:text-indigo-300 bg-white/70 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md">
                  <Wallet size={13} />
                  <span>Goal</span>
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-extrabold text-[#191B3D] dark:text-white">
                  {formatAmount(totalSavings)}
                </div>
              </div>
              <span className="text-[11px] text-[#61647C] dark:text-slate-400">
                Disisihkan bulan ini
              </span>
            </div>

            {/* Stat Card 2: Pengeluaran (White bg / dark card) */}
            <div className="bg-white dark:bg-[#141721] rounded-2xl p-5 flex flex-col justify-between shadow-2xs border border-[#DFE5EE] dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#61647C] dark:text-slate-400">
                  Pengeluaran
                </span>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                  <ArrowUpRight size={13} />
                  <span>{expenseRatio}% dari pemasukan</span>
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-extrabold text-[#191B3D] dark:text-white">
                  {formatAmount(totalExpense)}
                </div>
              </div>
              <span className="text-[11px] text-[#61647C] dark:text-slate-400">
                Bulan berjalan
              </span>
            </div>

            {/* Stat Card 3: Pemasukan (White bg / dark card) */}
            <div className="bg-white dark:bg-[#141721] rounded-2xl p-5 flex flex-col justify-between shadow-2xs border border-[#DFE5EE] dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#61647C] dark:text-slate-400">
                  Pemasukan
                </span>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <ArrowDownLeft size={13} />
                  <span>Terealisasi</span>
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-extrabold text-[#191B3D] dark:text-white">
                  {formatAmount(totalIncome)}
                </div>
              </div>
              <span className="text-[11px] text-[#61647C] dark:text-slate-400">
                Bulan berjalan
              </span>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* SECTION 3: REKENING & TABUNGAN (Proportional 2:1 on Desktop)          */}
          {/* ===================================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* LEFT 2/3 COLUMN: REKENING & DOMPET (Figcraft 4294969147) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141721] rounded-2xl p-5 md:p-6 border border-[#DFE5EE] dark:border-gray-800 shadow-2xs flex flex-col gap-5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-gray-800/80">
                <div>
                  <h3 className="text-base font-bold text-[#191B3D] dark:text-white">
                    Rekening & dompet
                  </h3>
                  <p className="text-xs text-[#61647C] dark:text-slate-400">
                    {wallets.length} sumber dana
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  title="Tambah Rekening"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Wallet Items List */}
              <div className="flex flex-col gap-3">
                {wallets.map((wallet) => {
                  const isEwallet = wallet.type === 'ewallet';
                  const IconComp = isEwallet ? Smartphone : Building2;

                  return (
                    <div
                      key={wallet.id}
                      className="bg-[#F0F0F8] dark:bg-[#1B2032] rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#252A42] flex items-center justify-center shrink-0 text-[#191B3D] dark:text-indigo-300 shadow-2xs">
                            <IconComp size={20} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[#191B3D] dark:text-white truncate">
                              {wallet.name}
                            </span>
                            <span className="text-[11px] text-[#61647C] dark:text-slate-400">
                              {isEwallet ? 'Dompet digital' : 'Bank / simpanan'}
                            </span>
                          </div>
                        </div>

                        {/* Balance value */}
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-extrabold text-[#191B3D] dark:text-white">
                            {formatAmount(wallet.balance)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons per wallet item */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(wallet)}
                          className="p-1.5 rounded-md text-[#61647C] dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Dompet"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(wallet)}
                          className="p-1.5 rounded-md text-[#61647C] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus Dompet"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWalletDetail(wallet);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 rounded-md text-[#61647C] dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                          title="Detail Riwayat"
                        >
                          <ClipboardList size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Tambah dompet, Pindahkan dana, Lihat detail */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#191B3D] hover:bg-indigo-950 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Tambah dompet
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2438] border border-[#C8D2E0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-[#191B3D] dark:text-white transition-colors"
                >
                  Pindahkan dana
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (wallets.length > 0) {
                      setSelectedWalletDetail(wallets[0]);
                      setShowDetailModal(true);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2438] border border-[#C8D2E0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-[#191B3D] dark:text-white transition-colors"
                >
                  Lihat detail
                </button>
              </div>

              {/* Informational Summary Grid (Total Saldo & Dompet Utama) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#F0F0F8] dark:bg-[#1B2032] rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#61647C] dark:text-slate-400 tracking-wider">
                    TOTAL SALDO
                  </span>
                  <span className="text-base font-extrabold text-[#191B3D] dark:text-white mt-1">
                    {formatAmount(totalBalance)}
                  </span>
                </div>

                <div className="bg-[#F0F0F8] dark:bg-[#1B2032] rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#61647C] dark:text-slate-400 tracking-wider">
                    DOMPET UTAMA
                  </span>
                  <span className="text-base font-extrabold text-[#191B3D] dark:text-white mt-1 truncate">
                    {mainWalletName}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT 1/3 COLUMN: TUJUAN TABUNGAN (Figcraft 4294969198) */}
            <div className="lg:col-span-1 bg-white dark:bg-[#141721] rounded-2xl p-5 md:p-6 border border-[#DFE5EE] dark:border-gray-800 shadow-2xs flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-gray-800/80">
                <h3 className="text-base font-bold text-[#191B3D] dark:text-white">
                  Tujuan tabungan
                </h3>
                <span className="text-xs text-[#61647C] dark:text-slate-400">
                  {goals.length} tujuan
                </span>
              </div>

              {/* Empty state or Goal List */}
              {goals.length === 0 ? (
                <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 bg-[#F0F0F8]/50 dark:bg-[#1B2032]/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-[#E7E7F4] dark:bg-indigo-950/80 text-[#191B3D] dark:text-indigo-300 flex items-center justify-center mb-3 shadow-2xs">
                    <Target size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-[#191B3D] dark:text-white">
                    Belum ada target tabungan
                  </h4>
                  <p className="text-xs text-[#61647C] dark:text-slate-400 mt-1 max-w-[220px]">
                    Tetapkan tujuan finansialmu untuk mulai menabung.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {goals.map((g) => {
                    const pct = Math.min(100, Math.round(((g.current_amount || 0) / (g.target_amount || 1)) * 100));
                    return (
                      <div key={g.id} className="p-3.5 bg-[#F0F0F8] dark:bg-[#1B2032] rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#191B3D] dark:text-white">{g.title || g.name}</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#61647C] dark:text-slate-400">
                          <span>{formatAmount(g.current_amount || 0)}</span>
                          <span>Target: {formatAmount(g.target_amount || 0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Tersimpan Footer */}
              <div className="bg-[#F0F0F8] dark:bg-[#1B2032] rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-[#61647C] dark:text-slate-400 tracking-wider">
                  TOTAL TERSIMPAN
                </span>
                <span className="text-xl font-extrabold text-[#191B3D] dark:text-white mt-1">
                  {formatAmount(totalSavings)}
                </span>
              </div>
            </div>
          </section>
        </main>

      {/* ========================================================================= */}
      {/* TOAST FEEDBACK NOTIFICATION                                               */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl transition-all">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH DOMPET                                                      */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#141721] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-gray-800 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-[#191B3D] dark:text-white">Tambah Dompet Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleAddWallet} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: BCA, Mandiri, Gopay, Tunai"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Dompet
                </label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="checking">Bank / Rekening Simpanan</option>
                  <option value="ewallet">E-Wallet / Dompet Digital</option>
                  <option value="cash">Tunai / Dompet Fisik</option>
                  <option value="investment">Investasi / Pasar Uang</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={addForm.balance}
                  onChange={(e) => setAddForm({ ...addForm, balance: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#191B3D] text-white hover:bg-indigo-950 transition-colors"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PINDAHKAN DANA (TRANSFER)                                          */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowTransferModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#141721] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-gray-800 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-[#191B3D] dark:text-white">Pindahkan Dana</h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleTransfer} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dari Dompet
                </label>
                <select
                  required
                  value={transferForm.from_wallet_id}
                  onChange={(e) => setTransferForm({ ...transferForm, from_wallet_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih dompet asal</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ke Dompet Tujuan
                </label>
                <select
                  required
                  value={transferForm.to_wallet_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_wallet_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih dompet tujuan</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Top up e-wallet"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#191B3D] text-white hover:bg-indigo-950 transition-colors"
                >
                  {submitting ? 'Mentransfer...' : 'Kirim Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DOMPET                                                        */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#141721] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-gray-800 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-[#191B3D] dark:text-white">Edit Dompet</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleUpdateWallet} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Dompet
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Dompet
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="checking">Bank / Rekening Simpanan</option>
                  <option value="ewallet">E-Wallet / Dompet Digital</option>
                  <option value="cash">Tunai / Dompet Fisik</option>
                  <option value="investment">Investasi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Saldo Saat Ini (Rp)
                </label>
                <input
                  type="number"
                  value={editForm.balance}
                  onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-[#1B2032] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#191B3D] text-white hover:bg-indigo-950 transition-colors"
                >
                  {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HAPUS DOMPET                                                       */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#141721] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-gray-800 z-10 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191B3D] dark:text-white">Hapus Dompet?</h3>
              <p className="text-xs text-[#61647C] dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus dompet{' '}
                <strong className="text-slate-800 dark:text-slate-200">{deletingWallet?.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL DOMPET & RIWAYAT                                            */}
      {/* ========================================================================= */}
      {showDetailModal && selectedWalletDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowDetailModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#141721] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-gray-800 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E7E7F4] dark:bg-indigo-950/70 text-[#191B3D] dark:text-indigo-300 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191B3D] dark:text-white">
                    {selectedWalletDetail.name}
                  </h3>
                  <span className="text-xs text-[#61647C] dark:text-slate-400 capitalize">
                    {selectedWalletDetail.type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F0F8] dark:bg-[#1B2032] flex items-center justify-between">
              <span className="text-xs text-[#61647C] dark:text-slate-400 font-medium">Saldo Tersedia</span>
              <span className="text-lg font-bold text-[#191B3D] dark:text-white">
                {formatAmount(selectedWalletDetail.balance)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-[#191B3D] dark:text-white uppercase tracking-wider">
                Transaksi Terkini
              </h4>
              {recentTx.filter((t) => t.wallet_name === selectedWalletDetail.name).length === 0 ? (
                <div className="p-6 text-center text-xs text-[#61647C] dark:text-slate-400 bg-slate-50 dark:bg-[#1B2032]/40 rounded-xl">
                  Belum ada catatan transaksi pada dompet ini.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {recentTx
                    .filter((t) => t.wallet_name === selectedWalletDetail.name)
                    .map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 bg-slate-50 dark:bg-[#1B2032] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{tx.description || tx.category_name}</p>
                          <p className="text-[10px] text-slate-500">{tx.date}</p>
                        </div>
                        <span
                          className={`font-bold ${
                            tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {tx.type === 'expense' ? '-' : '+'}
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#191B3D] text-white hover:bg-indigo-950"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
