import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';

export default function Wallets() {
  const { authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();
  const [wallets, setWallets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  // Period dropdown
  const [selectedPeriod, setSelectedPeriod] = useState('September 2026');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#period-dropdown-wallets')) {
        setShowPeriodDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Edit & Delete modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    type: 'checking',
    balance: '',
    icon: '💳',
    color: '#0E2038',
  });
  const [editError, setEditError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Toast / feedback message
  const [actionSuccess, setActionSuccess] = useState('');

  const showNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess('');
    }, 3500);
  };

  // Button hover/active state
  const [hoverBtn, setHoverBtn] = useState(null);
  const [activeBtn, setActiveBtn] = useState(null);

  // Forms
  const [form, setForm] = useState({
    name: '',
    type: 'checking',
    balance: '',
    icon: '💳',
    color: '#0E2038',
  });

  const [transferForm, setTransferForm] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: '',
    fee_amount: '',
    note: '',
  });

  const [formError, setFormError] = useState('');
  const [transferError, setTransferError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walRes, goalRes, txRes] = await Promise.all([
        authFetch('/api/wallets'),
        authFetch('/api/goals'),
        authFetch('/api/transactions?limit=10'),
      ]);

      if (walRes.ok) {
        const data = await walRes.json();
        setWallets(data);
      }
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setRecentTx(txData);
      }
    } catch (err) {
      console.error('Failed to load wallets data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute values strictly from real database data (starts from 0)
  const totalBalance = wallets.reduce((s, w) => s + parseFloat(w.balance || 0), 0);
  const totalSavings = goals.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);

  const incomeTx = recentTx.filter((t) => t.type === 'income');
  const expenseTx = recentTx.filter((t) => t.type === 'expense');
  const totalIncome = incomeTx.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = expenseTx.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : (totalExpense > 0 ? '100' : '0');
  const incomeTxCount = incomeTx.length;

  const displayTotalBalance = totalBalance;
  const displayTotalSavings = totalSavings;
  const mainWalletName = wallets[0]?.name || 'Belum ada dompet';

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError('');
    if (!transferForm.from_wallet_id || !transferForm.to_wallet_id || !transferForm.amount) {
      return setTransferError('Lengkapi semua data transfer');
    }
    if (transferForm.from_wallet_id === transferForm.to_wallet_id) {
      return setTransferError('Dompet asal dan tujuan tidak boleh sama');
    }

    setSaving(true);
    try {
      const res = await authFetch('/api/wallets/transfer', {
        method: 'POST',
        body: JSON.stringify(transferForm),
      });

      if (res.ok) {
        setShowTransferModal(false);
        setTransferForm({
          from_wallet_id: wallets[0]?.id || '',
          to_wallet_id: wallets[1]?.id || '',
          amount: '',
          fee_amount: '',
          note: '',
        });
        showNotification('Transfer dana berhasil dilakukan!');
        loadData();
      } else {
        const d = await res.json();
        setTransferError(d.error || 'Gagal melakukan transfer');
      }
    } catch (err) {
      setTransferError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Nama dompet harus diisi');

    setSaving(true);
    try {
      const res = await authFetch('/api/wallets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          balance: parseFloat(form.balance) || 0,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', type: 'checking', balance: '', icon: '💳', color: '#0E2038' });
        showNotification('Dompet baru berhasil ditambahkan!');
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan dompet');
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (wallet) => {
    setEditingWallet(wallet);
    setEditForm({
      id: wallet.id,
      name: wallet.name || '',
      type: wallet.type || 'checking',
      balance: wallet.balance !== undefined ? wallet.balance : '',
      icon: wallet.icon || '💳',
      color: wallet.color || '#0E2038',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.name.trim()) return setEditError('Nama dompet harus diisi');

    setSaving(true);
    try {
      const res = await authFetch(`/api/wallets/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          type: editForm.type,
          balance: parseFloat(editForm.balance) || 0,
          icon: editForm.icon,
          color: editForm.color,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingWallet(null);
        showNotification(`Dompet "${editForm.name.trim()}" berhasil diperbarui!`);
        loadData();
      } else {
        const d = await res.json();
        setEditError(d.error || 'Gagal memperbarui dompet');
      }
    } catch (err) {
      setEditError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (wallet) => {
    setDeletingWallet(wallet);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingWallet) return;
    setDeleteError('');
    setSaving(true);
    try {
      const res = await authFetch(`/api/wallets/${deletingWallet.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowDeleteModal(false);
        const deletedName = deletingWallet.name;
        setDeletingWallet(null);
        showNotification(`Dompet "${deletedName}" berhasil dihapus!`);
        loadData();
      } else {
        const d = await res.json();
        setDeleteError(d.error || 'Gagal menghapus dompet');
      }
    } catch (err) {
      setDeleteError(err.message || 'Terjadi kesalahan saat menghapus dompet');
    } finally {
      setSaving(false);
    }
  };

  const getBadgeText = (wallet) => {
    if (wallet.badge) return wallet.badge;
    const name = wallet.name.toUpperCase();
    if (name.includes('BCA')) return 'BCA';
    if (name.includes('MANDIRI')) return 'MDR';
    if (name.includes('BRI')) return 'BRI';
    if (name.includes('BNI')) return 'BNI';
    if (name.includes('JAGO')) return 'JGO';
    if (name.includes('GOPAY')) return 'GP';
    if (name.includes('OVO')) return 'OVO';
    if (name.includes('DANA')) return 'DNA';
    if (name.includes('TUNAI') || name.includes('CASH')) return 'TN';
    return name.slice(0, 2);
  };

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
            Dompet
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Data tersimpan
          </div>
          <NotificationButton />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            30 September 2026
          </span>
        </div>
      </div>

      <div className="page-content">
        {actionSuccess && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 18px',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: 12,
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <Icon name="check_circle" size={18} color="var(--success)" />
            <span>{actionSuccess}</span>
          </div>
        )}

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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.4px' }}>
              Dompetmu, lebih rapi
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18, maxWidth: 440 }}>
              Lihat saldo tersedia, rekening aktif, dan tujuan tabunganmu dalam satu pandangan.
            </p>

            {/* Date Pill Dropdown */}
            <div id="period-dropdown-wallets" style={{ position: 'relative', display: 'inline-block', zIndex: 100 }}>
              <button
                type="button"
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  background: '#FFFFFF',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <Icon name="calendar_today" size={15} style={{ color: 'var(--primary)' }} />
                <span>{selectedPeriod}</span>
                <Icon name={showPeriodDropdown ? 'expand_less' : 'expand_more'} size={16} style={{ color: 'var(--primary)' }} />
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
                    minWidth: 190,
                    padding: '6px 0',
                    overflow: 'hidden',
                  }}
                >
                  {['September 2026', 'Agustus 2026', 'Juli 2026', 'Juni 2026', 'Mei 2026', 'Tahun 2026'].map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setSelectedPeriod(p);
                        setShowPeriodDropdown(false);
                      }}
                      style={{
                        padding: '9px 16px',
                        fontSize: 12.5,
                        color: selectedPeriod === p ? 'var(--primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: selectedPeriod === p ? 700 : 500,
                        background: selectedPeriod === p ? 'var(--primary-50)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.12s',
                      }}
                      onMouseOver={(e) => { if (selectedPeriod !== p) e.currentTarget.style.background = 'var(--primary-50)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = selectedPeriod === p ? 'var(--primary-50)' : 'transparent'; }}
                    >
                      {selectedPeriod === p && <Icon name="check" size={14} color="var(--primary)" />}
                      {selectedPeriod !== p && <span style={{ width: 14 }} />}
                      {p}
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
                borderRadius: 16,
                padding: '18px 24px',
                minWidth: 260,
                textAlign: 'left',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid #ECE7DE',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'none', color: 'var(--text-muted)', marginBottom: 6 }}>
                Saldo tersedia
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                {formatRupiah(displayTotalBalance)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Di luar tabungan yang dialokasikan
              </div>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards Row */}
        <div className="wallet-stats-grid">
          {/* Pemasukan */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>↙</span> Pemasukan
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#F1F3F5',
                  color: 'var(--text-secondary)',
                }}
              >
                {incomeTxCount} transaksi
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              {formatRupiah(totalIncome)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {selectedPeriod}
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>↗</span> Pengeluaran
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#F1F3F5',
                  color: 'var(--text-secondary)',
                }}
              >
                {expenseRatio}% dari pemasukan
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              {formatRupiah(totalExpense)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {selectedPeriod}
            </div>
          </div>

          {/* Total Tabungan */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Icon name="account_balance" size={16} style={{ marginRight: 4 }} /> Total tabungan
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#F1F3F5',
                  color: 'var(--text-secondary)',
                }}
              >
                {displayTotalSavings > 0 ? `+${formatRupiah(displayTotalSavings)}` : 'Rp0'}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              {formatRupiah(displayTotalSavings)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Disisihkan bulan ini
            </div>
          </div>
        </div>

        {/* Middle Section: 2 Columns */}
        <div className="wallet-mid-grid">
          {/* Left Column: Rekening & Dompet */}
          <div className="card" style={{ padding: 22, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                Rekening & dompet
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {wallets.length} sumber dana
              </span>
            </div>

            {/* List of Accounts */}
            <div style={{ marginBottom: 18 }}>
              {wallets.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: '#FAFAFC', borderRadius: 12, border: '1px dashed #E2E8F0', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#EDF0F4', marginBottom: 8 }}>
                    <Icon name="account_balance_wallet" size={20} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Belum ada dompet</div>
                  <div>Tambahkan rekening atau e-wallet pertamamu.</div>
                </div>
              ) : (
                wallets.map((w) => (
                  <div
                    key={w.id}
                    className="wallet-item-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div className="wallet-badge-sq">
                        {getBadgeText(w)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {w.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          {w.type === 'checking'
                            ? 'Rekening utama'
                            : w.type === 'ewallet'
                              ? 'E-wallet'
                              : w.type === 'cash'
                                ? 'Uang fisik'
                                : w.type === 'savings'
                                  ? 'Tabungan'
                                  : w.type}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {formatRupiah(w.balance)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(w)}
                          title="Edit dompet"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--primary-50)';
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.borderColor = 'var(--primary-200)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-card)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          <Icon name="edit" size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(w)}
                          title="Hapus dompet"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--danger-bg)';
                            e.currentTarget.style.color = 'var(--danger)';
                            e.currentTarget.style.borderColor = 'var(--danger)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-card)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          <Icon name="delete" size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="wallet-actions-row">
              {/* Tambah dompet */}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                onMouseEnter={() => setHoverBtn('add')}
                onMouseLeave={() => { setHoverBtn(null); setActiveBtn(null); }}
                onMouseDown={() => setActiveBtn('add')}
                onMouseUp={() => setActiveBtn(null)}
                style={{
                  background: activeBtn === 'add' ? '#061220' : hoverBtn === 'add' ? '#2563EB' : 'var(--primary)',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: hoverBtn === 'add' ? '0 4px 16px rgba(37,99,235,0.4)' : '0 2px 8px rgba(14,32,56,0.18)',
                  transform: activeBtn === 'add' ? 'scale(0.97)' : hoverBtn === 'add' ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                Tambah dompet
              </button>

              {/* Pindahkan dana */}
              <button
                type="button"
                onClick={() => {
                  setTransferError('');
                  if (wallets.length >= 2) {
                    setTransferForm((f) => ({
                      ...f,
                      from_wallet_id: wallets[0].id,
                      to_wallet_id: wallets[1].id,
                    }));
                  }
                  setShowTransferModal(true);
                }}
                onMouseEnter={() => setHoverBtn('transfer')}
                onMouseLeave={() => { setHoverBtn(null); setActiveBtn(null); }}
                onMouseDown={() => setActiveBtn('transfer')}
                onMouseUp={() => setActiveBtn(null)}
                style={{
                  background: activeBtn === 'transfer' ? '#061220' : hoverBtn === 'transfer' ? '#2563EB' : 'var(--primary)',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: hoverBtn === 'transfer' ? '0 4px 16px rgba(37,99,235,0.4)' : '0 2px 8px rgba(14,32,56,0.18)',
                  transform: activeBtn === 'transfer' ? 'scale(0.97)' : hoverBtn === 'transfer' ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                Pindahkan dana
              </button>

              {/* Lihat detail */}
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                onMouseEnter={() => setHoverBtn('detail')}
                onMouseLeave={() => { setHoverBtn(null); setActiveBtn(null); }}
                onMouseDown={() => setActiveBtn('detail')}
                onMouseUp={() => setActiveBtn(null)}
                style={{
                  background: activeBtn === 'detail' ? '#061220' : hoverBtn === 'detail' ? '#2563EB' : 'var(--primary)',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: hoverBtn === 'detail' ? '0 4px 16px rgba(37,99,235,0.4)' : '0 2px 8px rgba(14,32,56,0.18)',
                  transform: activeBtn === 'detail' ? 'scale(0.97)' : hoverBtn === 'detail' ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                Lihat detail
              </button>
            </div>

            {/* Bottom 2 Summary Boxes */}
            <div className="wallet-summary-row">
              <div className="wallet-summary-box">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Total rekening
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatRupiah(displayTotalBalance)}
                </div>
              </div>
              <div className="wallet-summary-box">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Dompet utama
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {mainWalletName}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tujuan Tabungan */}
          <div className="card" style={{ padding: 22, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                Tujuan tabungan
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {goals.length} tujuan
              </span>
            </div>

            {/* Goals List */}
            <div style={{ marginBottom: 16 }}>
              {goals.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: '#FAFAFC', borderRadius: 12, border: '1px dashed #E2E8F0', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#EDF0F4', marginBottom: 8 }}>
                    <Icon name="savings" size={20} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Belum ada target tabungan</div>
                  <div>Tetapkan tujuan finansialmu untuk mulai menabung.</div>
                </div>
              ) : (
                goals.map((g) => {
                  const cur = parseFloat(g.current_amount || 0);
                  const tgt = parseFloat(g.target_amount || 1);
                  const pct = Math.min(100, Math.round((cur / tgt) * 100));

                  return (
                    <div key={g.id} className="goal-item-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {g.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {pct}% dari target
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                        <span>Progress</span>
                        <span>{formatRupiah(cur)} / {formatRupiah(tgt)}</span>
                      </div>

                      <div className="goal-progress-bar">
                        <div className="goal-progress-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total Tabungan Bottom Box */}
            <div
              style={{
                background: '#F7F8FA',
                borderRadius: 12,
                padding: '16px 20px',
                border: '1px solid #ECEEF2',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                Total tabungan
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatRupiah(displayTotalSavings)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Aktivitas Terbaru Table */}
        <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
              Aktivitas terbaru
            </h3>
            <Link
              to="/transaksi"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--primary)',
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
                  <th style={{ paddingLeft: 24 }}>TRANSAKSI</th>
                  <th>TANGGAL</th>
                  <th>KATEGORI</th>
                  <th>DOMPET</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>NOMINAL</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#F1F3F5', marginBottom: 8 }}>
                        <Icon name="receipt_long" size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Belum ada riwayat transaksi</div>
                      <div style={{ fontSize: 12 }}>Transaksi dari dompetmu akan muncul di sini.</div>
                    </td>
                  </tr>
                ) : (
                  recentTx.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx.id}>
                        <td style={{ paddingLeft: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name={isIncome ? 'work' : 'local_mall'} size={16} color={isIncome ? 'var(--income-color)' : 'var(--expense-color)'} />
                            <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>
                              {tx.description}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          {formatDateShort(tx.date)}
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          {tx.category_name || '-'}
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          {tx.wallet_name || '-'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 24 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13.5,
                              color: isIncome ? 'var(--income-color)' : 'var(--text-primary)',
                            }}
                          >
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
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
              padding: '12px 24px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11.5,
              color: 'var(--text-muted)',
              background: '#FAFAFC',
            }}
          >
            <span>{recentTx.length} transaksi ditampilkan</span>
            <Link to="/transaksi" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Semua transaksi</Link>
          </div>
        </div>

        {/* Insight Callout Banner */}
        <div className="insight-banner">
          <Icon name="spa" size={18} style={{ marginRight: 4 }} />
          <span>
            {displayTotalSavings > 0
              ? `Total tabungan terkumpul ${formatRupiah(displayTotalSavings)}. Kelola dan pantau terus perkembangan keuanganmu.`
              : 'Belum ada tabungan tercatat. Buat target tabungan dan tambahkan transaksi untuk memantau keuanganmu.'}
          </span>
        </div>
      </div>

      {/* Modal Tambah Dompet */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tambah Dompet / Rekening</div>
              <button
                style={{ background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            {formError && <div className="alert alert-error">⚠ {formError}</div>}
            <form onSubmit={handleCreateWallet}>
              <div className="form-group">
                <label className="form-label">Nama Dompet / Bank</label>
                <input
                  type="text"
                  placeholder="Contoh: BCA • 2048, GoPay, Tunai"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Akun</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="checking">Rekening utama / Bank</option>
                  <option value="ewallet">E-wallet</option>
                  <option value="cash">Uang fisik / Tunai</option>
                  <option value="savings">Tabungan</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="form-input"
                  value={form.balance}
                  onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pindahkan Dana (Transfer) */}
      {showTransferModal && (
        <div className="modal-backdrop" onClick={() => setShowTransferModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Pindahkan Dana Antar Dompet</div>
              <button
                style={{ background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowTransferModal(false)}
              >
                ✕
              </button>
            </div>
            {transferError && <div className="alert alert-error">⚠ {transferError}</div>}
            {wallets.length < 2 && (
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                Tambahkan minimal 2 dompet untuk melakukan transfer antar dompet.
              </div>
            )}
            <form onSubmit={handleTransferSubmit}>
              <div className="form-group">
                <label className="form-label">Dari Dompet (Asal)</label>
                <select
                  className="form-select"
                  value={transferForm.from_wallet_id}
                  onChange={(e) => setTransferForm((p) => ({ ...p, from_wallet_id: e.target.value }))}
                  required
                >
                  <option value="">Pilih Dompet Asal</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ke Dompet (Tujuan)</label>
                <select
                  className="form-select"
                  value={transferForm.to_wallet_id}
                  onChange={(e) => setTransferForm((p) => ({ ...p, to_wallet_id: e.target.value }))}
                  required
                >
                  <option value="">Pilih Dompet Tujuan</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 100000"
                  className="form-input"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Biaya Admin / Pajak Top-Up (Opsional)</span>
                  {parseFloat(transferForm.fee_amount || 0) > 0 && (
                    <span style={{ color: '#D97706', fontWeight: 700, fontSize: 11.5, background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                      +{formatRupiah(transferForm.fee_amount)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 1500 atau 2000"
                  className="form-input"
                  value={transferForm.fee_amount || ''}
                  onChange={(e) => setTransferForm((p) => ({ ...p, fee_amount: e.target.value }))}
                />
                {/* Quick fee buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {['0', '1000', '1500', '2000', '2500'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTransferForm((p) => ({ ...p, fee_amount: val === '0' ? '' : val }))}
                      style={{
                        border: '1px solid var(--border)',
                        background: (val === '0' && !transferForm.fee_amount) || transferForm.fee_amount === val ? 'var(--primary)' : '#FFFFFF',
                        color: (val === '0' && !transferForm.fee_amount) || transferForm.fee_amount === val ? '#FFFFFF' : 'var(--text-secondary)',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {val === '0' ? 'Tanpa Biaya (Gratis)' : `+${formatRupiah(val)}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rincian Live Box */}
              {parseFloat(transferForm.amount || 0) > 0 && (
                <div
                  style={{
                    background: 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <span>Dana Masuk ke Tujuan</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatRupiah(parseFloat(transferForm.amount || 0))}
                    </span>
                  </div>
                  {parseFloat(transferForm.fee_amount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', marginBottom: 4 }}>
                      <span>Biaya Admin / Pajak</span>
                      <span style={{ fontWeight: 700 }}>
                        + {formatRupiah(parseFloat(transferForm.fee_amount || 0))}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 6,
                      borderTop: '1px dashed var(--border)',
                      fontWeight: 800,
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>Total Terpotong dari Asal</span>
                    <span style={{ color: 'var(--expense-color)' }}>
                      {formatRupiah(parseFloat(transferForm.amount || 0) + parseFloat(transferForm.fee_amount || 0))}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Tarik tunai ATM, Top up e-wallet"
                  className="form-input"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTransferModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || wallets.length < 2}>
                  {saving ? 'Memproses...' : 'Pindahkan Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Dompet */}
      {showDetailModal && (
        <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Rincian Rekening & Dompet</div>
              <button
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div>
              {wallets.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada dompet terdaftar.
                </div>
              ) : (
                wallets.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border-light)',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div className="wallet-badge-sq" style={{ width: 34, height: 34, fontSize: 11 }}>
                        {getBadgeText(w)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {w.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {w.type === 'checking'
                            ? 'Rekening utama'
                            : w.type === 'ewallet'
                              ? 'E-wallet'
                              : w.type === 'cash'
                                ? 'Uang fisik'
                                : w.type === 'savings'
                                  ? 'Tabungan'
                                  : w.type}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>
                        {formatRupiah(w.balance)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDetailModal(false);
                            handleOpenEdit(w);
                          }}
                          title="Edit dompet"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            width: 28,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDetailModal(false);
                            handleOpenDelete(w);
                          }}
                          title="Hapus dompet"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            width: 28,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          <Icon name="delete" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Dompet */}
      {showEditModal && editingWallet && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Dompet / Rekening</div>
              <button
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            {editError && <div className="alert alert-error">⚠ {editError}</div>}
            <form onSubmit={handleUpdateWallet}>
              <div className="form-group">
                <label className="form-label">Nama Dompet / Bank</label>
                <input
                  type="text"
                  placeholder="Contoh: BCA, GoPay, Tunai"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Akun</label>
                <select
                  className="form-select"
                  value={editForm.type}
                  onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="checking">Rekening utama / Bank</option>
                  <option value="ewallet">E-wallet</option>
                  <option value="cash">Uang fisik / Tunai</option>
                  <option value="savings">Tabungan</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Saldo (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="form-input"
                  value={editForm.balance}
                  onChange={(e) => setEditForm((p) => ({ ...p, balance: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dompet */}
      {showDeleteModal && deletingWallet && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Icon name="delete" size={28} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Hapus Dompet?
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 auto 12px', maxWidth: 360 }}>
                Apakah kamu yakin ingin menghapus dompet <strong>"{deletingWallet.name}"</strong>?
              </p>
              <div
                style={{
                  background: 'var(--bg-card2)',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Saldo saat ini:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(deletingWallet.balance)}</strong>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                  ℹ️ Riwayat transaksi tidak akan dihapus, namun keterangan sumber dompet akan disesuaikan.
                </div>
              </div>
            </div>

            {deleteError && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠ {deleteError}</div>}

            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 8, justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleConfirmDelete}
                disabled={saving}
                style={{
                  background: 'var(--danger)',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                {saving ? 'Menghapus...' : 'Hapus Dompet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
