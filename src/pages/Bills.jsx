import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../lib/utils';
import Icon from '../components/Icon';

const BILL_CATEGORIES = [
  { label: 'Internet & WiFi', icon: '📶' },
  { label: 'Listrik & Air', icon: '⚡' },
  { label: 'Hiburan & Streaming', icon: '🎬' },
  { label: 'Tempat Tinggal / Kos', icon: '🏠' },
  { label: 'Asuransi & BPJS', icon: '🏥' },
  { label: 'Telepon & Pulsa', icon: '📱' },
  { label: 'Cicilan / Pinjaman', icon: '💳' },
  { label: 'Lainnya', icon: '📄' },
];

export default function Bills() {
  const { authFetch } = useAuth();
  const [bills, setBills] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const [form, setForm] = useState({
    name: '',
    amount: '',
    due_day: '1',
    category: 'Internet & WiFi',
    wallet_id: '',
    icon: '📶',
  });

  const [payWalletId, setPayWalletId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsRes, walletsRes] = await Promise.all([
        authFetch('/api/bills'),
        authFetch('/api/wallets'),
      ]);

      if (billsRes.ok) setBills(await billsRes.json());
      if (walletsRes.ok) {
        const walData = await walletsRes.json();
        setWallets(walData);
        if (walData.length > 0 && !form.wallet_id) {
          setForm((f) => ({ ...f, wallet_id: walData[0].id }));
          setPayWalletId(walData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.amount) {
      return setError('Nama dan nominal tagihan wajib diisi');
    }

    setSaving(true);
    try {
      const res = await authFetch('/api/bills', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowAddModal(false);
        setForm({
          name: '',
          amount: '',
          due_day: '1',
          category: 'Internet & WiFi',
          wallet_id: wallets[0]?.id || '',
          icon: '📶',
        });
        loadData();
      } else {
        const d = await res.json();
        setError(d.error || 'Gagal menambahkan tagihan');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    setSaving(true);
    try {
      const res = await authFetch(`/api/bills/${selectedBill.id}/pay`, {
        method: 'PUT',
        body: JSON.stringify({ wallet_id: payWalletId }),
      });

      if (res.ok) {
        setShowPayModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal memproses pembayaran');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Hapus daftar tagihan ini?')) return;
    try {
      await authFetch(`/api/bills/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Gagal menghapus tagihan');
    }
  };

  const totalMonthlyBills = bills.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const unpaidBills = bills.filter((b) => !b.is_paid);
  const totalUnpaid = unpaidBills.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const paidCount = bills.filter((b) => b.is_paid).length;

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Tagihan</span>
          <span className="topbar-title">Tagihan Rutin & Langganan</span>
        </div>
        <div className="topbar-right">
          <button
            id="add-bill-top-btn"
            className="btn btn-primary"
            onClick={() => {
              setError('');
              setShowAddModal(true);
            }}
          >
            + Tambah Tagihan
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Signature Biru Dongker Hero Banner */}
        <div className="navy-banner">
          <div className="navy-banner-left">
            <h1 className="navy-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="calendar_today" size={26} /> Tagihan &amp; Langganan
            </h1>
            <p className="navy-banner-subtitle">
              Pantau jatuh tempo beban rutin bulanan agar tidak terlambat bayar.
            </p>
            <div className="navy-banner-actions">
              <button
                className="navy-banner-btn primary"
                onClick={() => {
                  setError('');
                  setShowAddModal(true);
                }}
              >
                + Tambah Tagihan
              </button>
              <span className="navy-banner-btn">
                {paidCount} dari {bills.length} Lunas
              </span>
            </div>
          </div>

          <div className="navy-banner-right">
            <div className="navy-banner-stat-box">
              <div className="navy-banner-stat-label">Total Beban Tagihan</div>
              <div className="navy-banner-stat-value">{formatRupiah(totalMonthlyBills)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Sisa belum dibayar: {formatRupiah(totalUnpaid)}
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stat-cards" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-label">
              <span>Total Beban Bulanan</span>
              <Icon name="assignment" size={18} color="var(--primary)" />
            </div>
            <div className="stat-card-value">{formatRupiah(totalMonthlyBills)}</div>
            <div className="stat-card-change"><Icon name="calendar_today" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />{bills.length} Layanan rutin</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">
              <span>Belum Dibayar</span>
              <Icon name="hourglass_empty" size={18} color="var(--expense-color)" />
            </div>
            <div className="stat-card-value" style={{ color: totalUnpaid > 0 ? 'var(--danger)' : 'var(--income-color)' }}>
              {formatRupiah(totalUnpaid)}
            </div>
            <div className="stat-card-change down">{unpaidBills.length} Tagihan tertunda</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">
              <span>Status Pelunasan</span>
              <Icon name="check_circle" size={18} color="var(--income-color)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
              {paidCount} / {bills.length}
            </div>
            <div className="stat-card-change">✓ Bulan berjalan</div>
          </div>
        </div>

        {/* Bills List */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Jadwal Tagihan Berkala</div>
              <div className="card-subtitle">Pengingat jatuh tempo pengeluaran setiap bulan</div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Memuat daftar tagihan...
            </div>
          ) : bills.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Layanan & Kategori</th>
                    <th>Jatuh Tempo</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: '#1B433215',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                            }}
                          >
                            {bill.icon || <Icon name="receipt_long" size={20} color="var(--primary)" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{bill.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bill.category}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          Tgl {bill.due_day} setiap bulan
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {bill.is_paid
                            ? 'Lunas bulan ini'
                            : bill.daysUntilDue > 0
                            ? `${bill.daysUntilDue} hari lagi`
                            : bill.daysUntilDue === 0
                            ? 'Hari ini!'
                            : 'Terlambat'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 14 }}>
                        {formatRupiah(bill.amount)}
                      </td>
                      <td>
                        {bill.is_paid ? (
                          <span className="badge badge-income">✓ Sudah Bayar</span>
                        ) : bill.status === 'overdue' ? (
                          <span className="badge badge-expense"><Icon name="warning" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Terlambat</span>
                        ) : bill.status === 'due_today' ? (
                          <span className="badge" style={{ background: '#FEF3C7', color: '#B45309' }}>
                            <Icon name="warning" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Jatuh Tempo
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>
                            <Icon name="hourglass_empty" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Menunggu
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {!bill.is_paid ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setSelectedBill(bill);
                                setPayWalletId(bill.wallet_id || wallets[0]?.id || '');
                                setShowPayModal(true);
                              }}
                            >
                              Bayar
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginRight: 8 }}>
                              Lunas
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            style={{ background: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer' }}
                            title="Hapus Tagihan"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="notifications" size={40} /></div>
              <div className="empty-state-title">Belum ada tagihan rutin</div>
              <div className="empty-state-text">
                Catat tagihan seperti WiFi, Listrik, Netflix, dan sewa kos agar tidak terlewat jatuh tempo.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Tambah Tagihan Baru */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tambah Tagihan Rutin Bulanan</div>
              <button style={{ background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateBill}>
              <div className="form-group">
                <label className="form-label">Kategori Layanan</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {BILL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.label, icon: cat.icon }))}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: form.category === cat.label ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: form.category === cat.label ? '#F5F4F0' : 'white',
                        fontWeight: form.category === cat.label ? 700 : 500,
                      }}
                    >
                      <Icon name={form.category === cat.label ? 'check_circle' : ''} size={18} style={{ marginRight: 2 }} />
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Tagihan</label>
                <input
                  type="text"
                  placeholder="Contoh: WiFi IndiHome, Netflix Premium, Listrik PLN"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 350000"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Jatuh Tempo (Hari ke-)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Contoh: 20 (setiap tanggal 20)"
                  className="form-input"
                  value={form.due_day}
                  onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Dompet Pembayaran</label>
                <select
                  className="form-input"
                  value={form.wallet_id}
                  onChange={(e) => setForm((f) => ({ ...f, wallet_id: e.target.value }))}
                >
                  <option value="">Pilih Dompet (Opsional)</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bayar Tagihan */}
      {showPayModal && selectedBill && (
        <div className="modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Konfirmasi Pembayaran Tagihan</div>
              <button style={{ background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePayBill}>
              <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 10, marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Membayar Tagihan:</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedBill.name}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--expense-color)', marginTop: 8 }}>
                  {formatRupiah(selectedBill.amount)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Dompet untuk Membayar</label>
                <select
                  className="form-input"
                  value={payWalletId}
                  onChange={(e) => setPayWalletId(e.target.value)}
                  required
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Memproses...' : 'Konfirmasi & Potong Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
