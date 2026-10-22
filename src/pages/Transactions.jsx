import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';
import { notifyTransactionCreated, checkAndSendDailyReminder } from '../lib/notifications';

export default function Transactions() {
  const { authFetch } = useAuth();
  const { maskAmount } = usePrivacy();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ type: '', category_id: '', wallet_id: '', search: '', taxOnly: '' });
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

  // Edit Transaction State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set('type', filter.type);
      if (filter.category_id) params.set('category_id', filter.category_id);
      if (filter.wallet_id) params.set('wallet_id', filter.wallet_id);
      if (filter.search) params.set('search', filter.search);
      params.set('limit', '100');

      const [txRes, catRes, walRes] = await Promise.all([
        authFetch(`/api/transactions?${params}`),
        authFetch('/api/categories'),
        authFetch('/api/wallets'),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
        checkAndSendDailyReminder(txData);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (walRes.ok) {
        const walData = await walRes.json();
        setWallets(walData);
        if (walData.length > 0 && !form.wallet_id) {
          setForm((f) => ({ ...f, wallet_id: walData[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.wallet_id) return setFormError('Pilih dompet tujuan');
    if (!form.amount || parseFloat(form.amount) <= 0) return setFormError('Masukkan jumlah nominal valid');

    setSaving(true);
    try {
      const res = await authFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          wallet_id: form.wallet_id,
          category_id: form.category_id || null,
          amount: finalTotal,
          tax_amount: calculatedTax,
          type: form.type,
          description: form.description,
          date: form.date,
        }),
      });

      if (res.ok) {
        // Notifikasi ke HP & hitung total pengeluaran hari ini
        const categoryObj = categories.find((c) => String(c.id) === String(form.category_id));
        notifyTransactionCreated({
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
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan transaksi');
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan transaksi ini?')) return;
    try {
      await authFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Gagal menghapus transaksi');
    }
  };

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

    setEditingTx(tx);
    setEditForm({
      id: tx.id,
      wallet_id: tx.wallet_id || (wallets[0]?.id || ''),
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');

    if (!editForm.wallet_id) return setEditFormError('Pilih dompet tujuan');
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) return setEditFormError('Masukkan jumlah nominal valid');

    setEditSaving(true);
    try {
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
        setEditingTx(null);
        loadData();
      } else {
        const d = await res.json();
        setEditFormError(d.error || 'Gagal memperbarui transaksi');
      }
    } catch (err) {
      setEditFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setEditSaving(false);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  const totalTax = transactions
    .reduce((s, t) => s + parseFloat(t.tax_amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const displayTransactions = transactions.filter((t) => {
    if (filter.taxOnly === 'with_tax') return parseFloat(t.tax_amount || 0) > 0;
    if (filter.taxOnly === 'without_tax') return parseFloat(t.tax_amount || 0) === 0;
    return true;
  });

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const editFilteredCategories = categories.filter((c) => c.type === editForm.type);

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
            Transaksi
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Data tersimpan
          </div>
          <NotificationButton />
          <button
            id="add-transaction-btn"
            className="btn btn-primary"
            style={{ padding: '7px 16px', fontSize: 12.5 }}
            onClick={() => {
              if (wallets.length > 0 && !form.wallet_id) {
                setForm((f) => ({ ...f, wallet_id: wallets[0].id }));
              }
              setShowModal(true);
            }}
          >
            + Catat Transaksi
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* 4 Summary Stat Cards */}
        <div className="stat-cards" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-card-label">
              <span>Total Pemasukan</span>
              <Icon name="payments" size={18} color="var(--income-color)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--income-color)' }}>
              {maskAmount(formatRupiah(totalIncome))}
            </div>
            <div className="stat-card-change up">
              ↑ Catatan Pemasukan
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Total Pengeluaran</span>
              <Icon name="shopping_cart" size={18} color="var(--expense-color)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--expense-color)' }}>
              {maskAmount(formatRupiah(totalExpense))}
            </div>
            <div className="stat-card-change down">
              ↓ Catatan Pengeluaran
            </div>
          </div>

          <div
            className="stat-card"
            onClick={() => setFilter((f) => ({ ...f, taxOnly: f.taxOnly === 'with_tax' ? '' : 'with_tax' }))}
            style={{
              cursor: 'pointer',
              borderColor: filter.taxOnly === 'with_tax' ? '#D97706' : 'var(--border)',
              boxShadow: filter.taxOnly === 'with_tax' ? '0 0 0 2px rgba(217, 119, 6, 0.2)' : 'var(--shadow-sm)',
            }}
            title="Klik untuk menyaring transaksi yang memiliki pajak atau biaya admin"
          >
            <div className="stat-card-label">
              <span>Pajak & Biaya Admin</span>
              <Icon name="receipt_long" size={18} color="#D97706" />
            </div>
            <div className="stat-card-value" style={{ color: '#D97706' }}>
              {maskAmount(formatRupiah(totalTax))}
            </div>
            <div className="stat-card-change" style={{ color: filter.taxOnly === 'with_tax' ? '#92400E' : 'var(--text-secondary)' }}>
              🏷️ {transactions.filter((t) => parseFloat(t.tax_amount || 0) > 0).length} transaksi berpajak/fee {filter.taxOnly === 'with_tax' ? '✓ (Aktif)' : ''}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Selisih Arus Kas</span>
              <Icon name="analytics" size={18} color="var(--primary)" />
            </div>
            <div
              className="stat-card-value"
              style={{ color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}
            >
              {maskAmount(formatRupiah(netBalance))}
            </div>
            <div
              className="stat-card-change"
              style={{ color: netBalance >= 0 ? 'var(--income-color)' : 'var(--danger)' }}
            >
              {netBalance >= 0 ? '✓ Arus Kas Positif' : '✕ Arus Kas Negatif'}
            </div>
          </div>
         {/* Filter bar & Tabs */}
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14 }}>
          {/* Responsive Filter Grid: Search + Jenis + Kategori + Dompet */}
          <div className="transaction-filter-grid" style={{ marginBottom: 12 }}>
            {/* Search Input with Search Icon */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              >
                <Icon name="search" size={17} />
              </div>
              <input
                type="text"
                placeholder="Cari transaksi atau catatan..."
                className="form-input"
                style={{ paddingLeft: 38, width: '100%', height: 38 }}
                value={filter.search}
                onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              />
              {filter.search && (
                <button
                  type="button"
                  onClick={() => setFilter((f) => ({ ...f, search: '' }))}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 4,
                  }}
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Jenis Transaksi Dropdown */}
            <select
              className="form-select"
              style={{ width: '100%', height: 38 }}
              value={filter.taxOnly === 'with_tax' ? 'with_tax' : filter.type}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'with_tax') {
                  setFilter((f) => ({ ...f, type: '', taxOnly: 'with_tax' }));
                } else {
                  setFilter((f) => ({ ...f, type: val, taxOnly: '' }));
                }
              }}
            >
              <option value="">Semua Jenis Transaksi</option>
              <option value="income">🟢 Pemasukan (Income)</option>
              <option value="expense">🔴 Pengeluaran (Expense)</option>
              <option value="with_tax">🏷️ Ada Pajak / Fee ({transactions.filter((t) => parseFloat(t.tax_amount || 0) > 0).length})</option>
            </select>

            {/* Kategori Dropdown */}
            <select
              className="form-select"
              style={{ width: '100%', height: 38 }}
              value={filter.category_id}
              onChange={(e) => setFilter((f) => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            {/* Dompet Dropdown */}
            <select
              className="form-select"
              style={{ width: '100%', height: 38 }}
              value={filter.wallet_id}
              onChange={(e) => setFilter((f) => ({ ...f, wallet_id: e.target.value }))}
            >
              <option value="">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bottom Summary Bar: Results Count + Reset Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              paddingTop: 10,
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Menampilkan <strong>{displayTransactions.length}</strong> dari {transactions.length} transaksi
            </div>

            {(filter.type || filter.category_id || filter.wallet_id || filter.search || filter.taxOnly) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFilter({ type: '', category_id: '', wallet_id: '', search: '', taxOnly: '' })}
                style={{ padding: '4px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                ✕ Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="card">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
            </div>
          ) : displayTransactions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kategori & Keterangan</th>
                    <th>Dompet</th>
                    <th>Tanggal</th>
                    <th style={{ textAlign: 'right' }}>Nominal & Rincian</th>
                    <th style={{ width: 84, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const taxVal = parseFloat(tx.tax_amount || 0);
                    const hasTax = taxVal > 0;
                    const baseVal = Math.max(0, parseFloat(tx.amount) - taxVal);

                    return (
                      <tr key={tx.id}>
                        <td>
                          <div className="tx-category">
                            <div className="tx-icon">
                              {tx.category_icon || <Icon name={isIncome ? 'payments' : 'local_mall'} size={18} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>
                                {tx.description || tx.category_name || 'Transaksi'}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{tx.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</span>
                                {hasTax && (
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#B45309',
                                    background: '#FEF3C7',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    border: '1px solid #FDE68A',
                                  }}>
                                    ·ï¸ Ada Pajak/Admin Fee
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-wallet">{tx.wallet_name || 'Dompet Utama'}</span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {formatDateShort(tx.date)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={`tx-amount ${isIncome ? 'income' : 'expense'}`}
                            style={{ fontWeight: 700, display: 'inline-block' }}
                          >
                            {isIncome ? '+ ' : '- '}
                            {maskAmount(formatRupiah(tx.amount))}
                          </span>
                          {hasTax && (
                            <div style={{
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              marginTop: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 6,
                            }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                Pokok: <strong>{maskAmount(formatRupiah(baseVal))}</strong>
                              </span>
                              <span style={{ color: 'var(--border)' }}>â€¢</span>
                              <span style={{ color: '#D97706', fontWeight: 700, background: '#FFFBEB', padding: '1px 5px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                                Pajak/Fee: +{maskAmount(formatRupiah(taxVal))}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tx)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = 'var(--primary)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.background = 'var(--bg-card2)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.background = 'transparent';
                              }}
                              title="Edit Transaksi"
                            >
                              <Icon name="edit" size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(tx.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = 'var(--danger)';
                                e.currentTarget.style.borderColor = 'var(--danger)';
                                e.currentTarget.style.background = '#FEE2E2';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.background = 'transparent';
                              }}
                              title="Hapus Transaksi"
                            >
                              <Icon name="delete" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="description" size={40} /></div>
              <div className="empty-state-title">
                {transactions.length > 0 ? 'Tidak ada transaksi yang cocok' : 'Belum ada riwayat transaksi'}
              </div>
              <div className="empty-state-text">
                Tekan tombol "+ Catat Transaksi" untuk memasukkan catatan baru
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        id="mobile-add-tx-btn"
        className="mobile-fab-btn"
        onClick={() => {
          if (wallets.length > 0 && !form.wallet_id) {
            setForm((f) => ({ ...f, wallet_id: wallets[0].id }));
          }
          setShowModal(true);
        }}
        aria-label="Catat Transaksi Baru"
      >
        <Icon name="add" size={20} />
        <span>Catat Transaksi</span>
      </button>

      {/* Modal Catat Transaksi — Sesuai Tema Website */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          style={{ alignItems: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 20,
              width: '100%',
              maxWidth: 490,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(14, 32, 56, 0.18), 0 4px 16px rgba(14, 32, 56, 0.08)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              margin: '0 16px',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '20px 24px 14px',
              borderBottom: '1px solid var(--border-light)',
              flexShrink: 0,
            }}>
              <div>
                {/* Type badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: form.type === 'income'
                    ? '#ECFDF5'
                    : form.type === 'transfer'
                    ? '#EFF6FF'
                    : '#FEF2F2',
                  border: `1px solid ${form.type === 'income' ? '#A7F3D0' : form.type === 'transfer' ? '#BFDBFE' : '#FECDD3'}`,
                  borderRadius: 999,
                  padding: '4px 12px',
                  marginBottom: 8,
                }}>
                  <Icon
                    name={form.type === 'income' ? 'north_east' : form.type === 'transfer' ? 'swap_horiz' : 'south_west'}
                    size={13}
                    style={{
                      color: form.type === 'income' ? '#059669' : form.type === 'transfer' ? '#2563EB' : '#E11D48',
                    }}
                  />
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: form.type === 'income' ? '#059669' : form.type === 'transfer' ? '#2563EB' : '#E11D48',
                  }}>
                    {form.type === 'income' ? 'PEMASUKAN' : form.type === 'transfer' ? 'TRANSFER' : 'PENGELUARAN'}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Catat Transaksi Baru
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                title="Tutup Modal"
                aria-label="Tutup"
              >
                <Icon name="close" size={17} />
              </button>
            </div>

            {formError && (
              <div style={{
                margin: '12px 24px 0',
                background: '#FEF2F2',
                border: '1px solid #FECDD3',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Icon name="error" size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Type Selector - 3 pill tabs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 6,
                  background: 'var(--bg)',
                  padding: 4,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  {[
                    { key: 'expense', label: 'Pengeluaran', icon: 'remove', activeBg: '#E11D48' },
                    { key: 'income', label: 'Pemasukan', icon: 'add', activeBg: '#059669' },
                    { key: 'transfer', label: 'Transfer', icon: 'swap_horiz', activeBg: 'var(--primary)' },
                  ].map((t) => {
                    const isActive = form.type === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t.key, category_id: '' }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '9px 4px',
                          borderRadius: 8,
                          border: 'none',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          background: isActive ? t.activeBg : 'transparent',
                          color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                          boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                        }}
                      >
                        <Icon name={t.icon} size={15} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Nominal Box */}
                <div style={{
                  background: 'var(--bg-card2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                      NOMINAL (RP)
                    </span>
                    {parseFloat(form.amount) > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, amount: '' }))}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECDD3',
                          borderRadius: 999,
                          padding: '2px 9px',
                          fontSize: 11.5,
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Icon name="refresh" size={12} /> Reset
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-muted)' }}>Rp</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 34,
                        fontWeight: 800,
                        color: form.type === 'income'
                          ? '#059669'
                          : form.type === 'expense'
                          ? '#E11D48'
                          : 'var(--primary)',
                        width: '100%',
                        letterSpacing: '-1px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Quick add chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                        onClick={() => setForm((f) => ({ ...f, amount: String((parseFloat(f.amount) || 0) + chip.val) }))}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 999,
                          padding: '4px 11px',
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          boxShadow: 'var(--shadow-xs)',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.color = 'var(--primary)';
                          e.currentTarget.style.background = 'var(--primary-50)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.background = 'var(--bg-card)';
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Akun/Dompet + Tanggal in 2 cols */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="account_balance_wallet" size={15} style={{ color: 'var(--text-muted)' }} />
                      Akun / Dompet
                    </label>
                    <select
                      className="form-select"
                      value={form.wallet_id}
                      onChange={(e) => setForm((f) => ({ ...f, wallet_id: e.target.value }))}
                      required
                      style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: 10,
                        fontSize: 13,
                        width: '100%',
                        padding: '9px 12px',
                        fontWeight: 500,
                      }}
                    >
                      <option value="">Pilih dompet</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon name="calendar_month" size={15} style={{ color: 'var(--text-muted)' }} />
                      Tanggal
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      required
                      style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: 10,
                        fontSize: 13,
                        width: '100%',
                        padding: '9px 12px',
                        fontWeight: 500,
                      }}
                    />
                  </div>
                </div>

                {/* Kategori sebagai grid pill */}
                {form.type !== 'transfer' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Icon name="label" size={15} style={{ color: 'var(--text-muted)' }} />
                      Kategori
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {filteredCategories.map((c) => {
                        const isSelected = String(form.category_id) === String(c.id);
                        const isIncome = form.type === 'income';
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, category_id: isSelected ? '' : c.id }))}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '9px 10px',
                              borderRadius: 10,
                              border: isSelected
                                ? `1.5px solid ${isIncome ? '#059669' : '#E11D48'}`
                                : '1px solid var(--border)',
                              background: isSelected
                                ? (isIncome ? '#ECFDF5' : '#FEF2F2')
                                : 'var(--bg-card)',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected
                                ? (isIncome ? '#065F46' : '#9F1239')
                                : 'var(--text-primary)',
                              textAlign: 'left',
                              transition: 'all 0.12s ease',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'var(--shadow-xs)',
                            }}
                          >
                            <span style={{ fontSize: 15, flexShrink: 0 }}>{c.icon}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11.5 }}>
                              {c.name.length > 13 ? c.name.slice(0, 12) + '…' : c.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected category name display */}
                    {form.category_id && (() => {
                      const sel = filteredCategories.find((c) => String(c.id) === String(form.category_id));
                      return sel ? (
                        <div style={{
                          marginTop: 8,
                          padding: '7px 12px',
                          background: 'var(--bg-card2)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12.5,
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span>{sel.icon}</span>
                          <span>Terpilih: <strong>{sel.name}</strong></span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Pajak toggle (compact) */}
                <div style={{
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}>
                    <input
                      type="checkbox"
                      checked={form.hasTax}
                      onChange={(e) => setForm((f) => ({ ...f, hasTax: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <Icon name="receipt_long" size={16} color="#D97706" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Ada Pajak / Biaya Admin
                    </span>
                    {form.hasTax && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#92400E',
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}>
                        Aktif
                      </span>
                    )}
                  </label>

                  {form.hasTax && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {[
                          { mode: 'fixed', label: 'Nominal Tetap (Rp)' },
                          { mode: 'percent', label: 'Persentase (%)' },
                        ].map((m) => (
                          <button
                            key={m.mode}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, taxType: m.mode }))}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: form.taxType === m.mode ? 'var(--primary)' : 'var(--bg-card)',
                              color: form.taxType === m.mode ? '#fff' : 'var(--text-secondary)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                            {form.taxType === 'percent' ? 'Tarif (%)' : 'Nominal Pajak/Fee (Rp)'}
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            value={form.taxValue}
                            onChange={(e) => setForm((f) => ({ ...f, taxValue: e.target.value }))}
                            placeholder={form.taxType === 'percent' ? 'Contoh: 11' : 'Contoh: 2000'}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              fontSize: 12.5,
                              padding: '8px 10px',
                              borderRadius: 8,
                              width: '100%',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                            Keterangan Fee
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={form.taxNote}
                            onChange={(e) => setForm((f) => ({ ...f, taxNote: e.target.value }))}
                            placeholder="Contoh: PPN 11%, Fee Top Up"
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              fontSize: 12.5,
                              padding: '8px 10px',
                              borderRadius: 8,
                              width: '100%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Catatan */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Icon name="description" size={15} style={{ color: 'var(--text-muted)' }} />
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Contoh: Makan siang bersama tim, bensin, dll"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--text-primary)',
                      borderRadius: 10,
                      padding: '9px 12px',
                      fontSize: 13,
                      width: '100%',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 12,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: 12,
                      background: saving
                        ? 'var(--text-muted)'
                        : 'var(--primary)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 13.5,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(14,32,56,0.18)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {saving ? (
                      'Menyimpan...'
                    ) : (
                      <>
                        <Icon name="check" size={16} /> Catat Transaksi
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">âœï¸ Edit Transaksi</div>
              <button
                style={{ background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            {editFormError && <div className="alert alert-error">⚠️ {editFormError}</div>}
            <form onSubmit={handleUpdateSubmit}>
              {/* Jenis Transaksi */}
              <div className="form-group">
                <label className="form-label">Jenis Transaksi</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn ${editForm.type === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
                    style={editForm.type === 'expense' ? { background: 'var(--primary)' } : {}}
                    onClick={() => setEditForm((f) => ({ ...f, type: 'expense', category_id: '' }))}
                  >
                    ↓ Pengeluaran
                  </button>
                  <button
                    type="button"
                    className={`btn ${editForm.type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                    style={editForm.type === 'income' ? { background: 'var(--income-color)', borderColor: 'var(--income-color)' } : {}}
                    onClick={() => setEditForm((f) => ({ ...f, type: 'income', category_id: '' }))}
                  >
                    ↑ Pemasukan
                  </button>
                </div>
              </div>

              {/* Nominal */}
              <div className="form-group">
                <label className="form-label">Nominal Pokok (Rp)</label>
                <input
                  type="number"
                  placeholder="Masukkan nominal"
                  className="form-input"
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              {/* Pajak & Biaya Admin */}
              <div
                style={{
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.hasTax}
                      onChange={(e) => setEditForm((f) => ({ ...f, hasTax: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <span>·ï¸ Ada Pajak / Biaya Admin (Top-up, Resto, dll)</span>
                  </label>
                  {editForm.hasTax && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 6 }}>
                      Aktif
                    </span>
                  )}
                </div>

                {editForm.hasTax && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
                    {/* Mode: Fixed vs Percent */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <button
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, taxType: 'fixed' }))}
                        className={`btn btn-sm ${editForm.taxType === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '5px 8px', fontSize: 11.5 }}
                      >
                        Nominal Tetap (Rp)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, taxType: 'percent' }))}
                        className={`btn btn-sm ${editForm.taxType === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '5px 8px', fontSize: 11.5 }}
                      >
                        Persentase (%)
                      </button>
                    </div>

                    {editForm.taxType === 'fixed' ? (
                      <div>
                        <input
                          type="number"
                          placeholder="Contoh: 2000"
                          className="form-input"
                          style={{ fontSize: 13 }}
                          value={editForm.taxAmount}
                          onChange={(e) => setEditForm((f) => ({ ...f, taxAmount: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {['1000', '1500', '2000', '2500', '5000'].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, taxAmount: val }))}
                              style={{
                                border: '1px solid var(--border)',
                                background: editForm.taxAmount === val ? 'var(--primary)' : '#FFFFFF',
                                color: editForm.taxAmount === val ? '#FFFFFF' : 'var(--text-secondary)',
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 11,
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              +{formatRupiah(val)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Contoh: 10 atau 11"
                            className="form-input"
                            style={{ flex: 1, fontSize: 13 }}
                            value={editForm.taxAmount}
                            onChange={(e) => setEditForm((f) => ({ ...f, taxAmount: e.target.value }))}
                          />
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {[
                            { label: '10% (PB1 Resto)', val: '10' },
                            { label: '11% (PPN)', val: '11' },
                            { label: '5%', val: '5' },
                            { label: '2.5%', val: '2.5' },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, taxAmount: item.val }))}
                              style={{
                                border: '1px solid var(--border)',
                                background: editForm.taxAmount === item.val ? 'var(--primary)' : '#FFFFFF',
                                color: editForm.taxAmount === item.val ? '#FFFFFF' : 'var(--text-secondary)',
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 11,
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Preview Box */}
                    <div
                      style={{
                        marginTop: 12,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 4 }}>
                        <span>Nominal Pokok (Subtotal)</span>
                        <span style={{ fontWeight: 600 }}>{formatRupiah(editBaseAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', marginBottom: 6 }}>
                        <span>Pajak / Biaya Admin</span>
                        <span style={{ fontWeight: 700 }}>+ {formatRupiah(editCalculatedTax)}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingTop: 6,
                          borderTop: '1px dashed var(--border)',
                          fontWeight: 800,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span>Total Terpotong dari Dompet</span>
                        <span style={{ color: editForm.type === 'expense' ? 'var(--expense-color)' : 'var(--income-color)' }}>
                          {formatRupiah(editFinalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dompet */}
              <div className="form-group">
                <label className="form-label">Pilih Dompet / Akun</label>
                <select
                  className="form-select"
                  value={editForm.wallet_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, wallet_id: e.target.value }))}
                  required
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori */}
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select
                  className="form-select"
                  value={editForm.category_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                >
                  <option value="">Pilih Kategori (Opsional)</option>
                  {editFilteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div className="form-group">
                <label className="form-label">Tanggal Transaksi</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="form-group">
                <label className="form-label">Catatan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Misal: Makan siang, bayar listrik..."
                  className="form-input"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? 'Menyimpan...' : '✓ Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
