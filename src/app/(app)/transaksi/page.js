'use client';
import { useState, useEffect, useCallback } from 'react';
import { formatRupiah, formatDate } from '@/lib/utils';
import ThemeToggleBtn from '@/app/components/ThemeToggleBtn';
import { useTheme } from '@/app/components/ThemeProvider';

export default function TransaksiPage() {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ type: '', category_id: '', wallet_id: '' });
  const [summary, setSummary] = useState({ income: 0, expense: 0, total: 0 });
  const [form, setForm] = useState({
    wallet_id: '', category_id: '', amount: '', type: 'expense', description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set('type', filter.type);
      if (filter.category_id) params.set('category_id', filter.category_id);
      if (filter.wallet_id) params.set('wallet_id', filter.wallet_id);
      params.set('limit', '100');

      const [txRes, catRes, walRes] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch('/api/categories'),
        fetch('/api/wallets'),
      ]);

      const txData = await txRes.json();
      const catData = await catRes.json();
      const walData = await walRes.json();

      const txs = txData.transactions || [];
      setTransactions(txs);
      setCategories(catData.categories || []);
      setWallets(walData.wallets || []);

      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      setSummary({ income, expense, total: txData.total || txs.length });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.wallet_id) return setFormError('Pilih dompet');
    if (!form.category_id) return setFormError('Pilih kategori');
    if (!form.amount || parseFloat(form.amount) <= 0) return setFormError('Masukkan jumlah valid');
    setSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ wallet_id: '', category_id: '', amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0] });
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    loadData();
  };

  const filteredCats = categories.filter(c => !form.type || c.type === form.type);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Transaksi</span>
          <span className="topbar-title">Transaksi</span>
        </div>
        <div className="topbar-right">
          <ThemeToggleBtn />
          <button id="add-transaction-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Summary */}
        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total Pemasukan</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : 'var(--primary)' }}>{formatRupiah(summary.income)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Pengeluaran</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : 'var(--expense-color)' }}>{formatRupiah(summary.expense)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Selisih</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : (summary.income - summary.expense >= 0 ? 'var(--primary)' : 'var(--expense-color)') }}>
              {formatRupiah(summary.income - summary.expense)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ v: '', l: 'Semua' }, { v: 'income', l: '↑ Masuk' }, { v: 'expense', l: '↓ Keluar' }].map(opt => (
                <button
                  key={opt.v}
                  className={`chip ${filter.type === opt.v ? 'active' : ''}`}
                  onClick={() => setFilter(p => ({ ...p, type: opt.v }))}
                  id={`filter-${opt.l}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={filter.wallet_id}
              onChange={e => setFilter(p => ({ ...p, wallet_id: e.target.value }))}
            >
              <option value="">Semua Dompet</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </select>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={filter.category_id}
              onChange={e => setFilter(p => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            {(filter.type || filter.wallet_id || filter.category_id) && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ type: '', category_id: '', wallet_id: '' })}>
                ✕ Reset filter
              </button>
            )}
          </div>
        </div>

        {/* Transactions table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              Daftar Transaksi
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>({transactions.length} transaksi)</span>
            </div>
          </div>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : transactions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th>Dompet</th>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th style={{ textAlign: 'right' }}>Jumlah</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div className="tx-category">
                        <div className="tx-icon" style={{ background: `${tx.category_color || '#84A98C'}20` }}>
                          {tx.category_icon || '💸'}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{tx.category_name || 'Lainnya'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tx.description || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tx.wallet_name || '-'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(tx.date))}
                    </td>
                    <td>
                      <span className={`badge badge-${tx.type}`}>
                        {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`tx-amount ${tx.type}`} style={isDark ? { color: '#000000', fontWeight: 700 } : {}}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(tx.id)}
                        style={{ color: 'var(--danger)', padding: '4px 8px' }}
                        title="Hapus"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Belum ada transaksi</div>
              <div className="empty-state-text">Klik "Tambah Transaksi" untuk mulai mencatat</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Tambah Transaksi</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}

                {/* Type selector */}
                <div className="form-group">
                  <label className="form-label">Jenis Transaksi</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: 'income', l: '↑ Pemasukan' }, { v: 'expense', l: '↓ Pengeluaran' }].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        className={`chip ${form.type === opt.v ? 'active' : ''}`}
                        onClick={() => setForm(p => ({ ...p, type: opt.v, category_id: '' }))}
                        style={{ flex: 1, justifyContent: 'center', padding: '8px 0' }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jumlah (Rp)</label>
                  <input
                    id="tx-amount"
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    id="tx-category"
                    className="form-select"
                    value={form.category_id}
                    onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  >
                    <option value="">Pilih kategori</option>
                    {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dompet</label>
                  <select
                    id="tx-wallet"
                    className="form-select"
                    value={form.wallet_id}
                    onChange={e => setForm(p => ({ ...p, wallet_id: e.target.value }))}
                  >
                    <option value="">Pilih dompet</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name} ({formatRupiah(w.balance)})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input
                    id="tx-date"
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Keterangan (opsional)</label>
                  <input
                    id="tx-desc"
                    type="text"
                    className="form-input"
                    placeholder="Tulis keterangan..."
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button id="save-tx-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
