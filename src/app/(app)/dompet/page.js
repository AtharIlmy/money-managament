'use client';
import { useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/utils';
import ThemeToggleBtn from '@/app/components/ThemeToggleBtn';
import { useTheme } from '@/app/components/ThemeProvider';

const WALLET_TYPES = [
  { value: 'checking', label: 'Rekening', icon: '🏦' },
  { value: 'savings', label: 'Tabungan', icon: '🏪' },
  { value: 'cash', label: 'Tunai', icon: '💵' },
  { value: 'credit', label: 'Kartu Kredit', icon: '💳' },
  { value: 'ewallet', label: 'Dompet Digital', icon: '📱' },
];

const WALLET_COLORS = [
  '#1B4332', '#2D6A4F', '#40916C', '#52796F', '#264653',
  '#E76F51', '#E9C46A', '#F4A261', '#3D405B', '#6D6875',
];

const WALLET_ICONS = ['💳', '🏦', '💵', '📱', '🏪', '💰', '🪙', '💼'];

export default function DompetPage() {
  const { isDark } = useTheme();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'checking', balance: '', icon: '💳', color: '#1B4332' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      setWallets(data.wallets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWallets(); }, []);

  const totalBalance = wallets.reduce((s, w) => s + parseFloat(w.balance), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name) return setFormError('Nama dompet harus diisi');
    setSaving(true);
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, balance: parseFloat(form.balance) || 0 }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', type: 'checking', balance: '', icon: '💳', color: '#1B4332' });
        loadWallets();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus dompet ini? Semua transaksi terkait akan terpengaruh.')) return;
    await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
    loadWallets();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Dompet</span>
          <span className="topbar-title">Dompet</span>
        </div>
        <div className="topbar-right">
          <ThemeToggleBtn />
          <button id="add-wallet-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Dompet
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Total Balance Card */}
        <div className="card" style={{ background: 'var(--primary)', border: 'none', marginBottom: 24 }}>
          <div className="card-body" style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: 8 }}>
                  Total Kekayaan Bersih
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {formatRupiah(totalBalance)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {wallets.length} dompet aktif
                </div>
              </div>
              <div style={{ fontSize: 48, opacity: 0.3 }}>💳</div>
            </div>
          </div>
        </div>

        {/* Wallet breakdown */}
        {!loading && wallets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { type: 'savings', label: 'Tabungan', icon: '🏪' },
              { type: 'checking', label: 'Rekening', icon: '🏦' },
              { type: ['cash', 'ewallet', 'credit'], label: 'Lainnya', icon: '💵' },
            ].map((group, i) => {
              const types = Array.isArray(group.type) ? group.type : [group.type];
              const total = wallets.filter(w => types.includes(w.type)).reduce((s, w) => s + parseFloat(w.balance), 0);
              return (
                <div key={i} className="stat-card">
                  <div className="stat-card-label">{group.icon} {group.label}</div>
                  <div className="stat-card-value" style={{ color: isDark ? '#000000' : undefined }}>{formatRupiah(total)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wallet list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daftar Dompet & Akun</div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : wallets.length > 0 ? (
            <div>
              {wallets.map(wallet => (
                <div key={wallet.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderBottom: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: wallet.color || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {wallet.icon || '💳'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{wallet.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {WALLET_TYPES.find(t => t.value === wallet.type)?.label || wallet.type}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 16, fontWeight: 700,
                        color: isDark ? '#000000' : (parseFloat(wallet.balance) >= 0 ? 'var(--text-primary)' : 'var(--danger)')
                      }}>
                        {formatRupiah(wallet.balance)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saldo saat ini</div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(wallet.id)}
                      style={{ color: 'var(--danger)', padding: '6px 8px' }}
                      title="Hapus dompet"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-title">Belum ada dompet</div>
              <div className="empty-state-text">Tambah dompet atau akun bank pertama Anda</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Tambah Dompet</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Nama Dompet</label>
                  <input id="wallet-name" type="text" className="form-input" placeholder="cth: BCA Tabungan" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {WALLET_TYPES.map(t => (
                      <button key={t.value} type="button"
                        className={`chip ${form.type === t.value ? 'active' : ''}`}
                        onClick={() => setForm(p => ({ ...p, type: t.value, icon: t.icon }))}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Saldo Awal (Rp)</label>
                  <input id="wallet-balance" type="number" className="form-input" placeholder="0" value={form.balance} onChange={e => setForm(p => ({ ...p, balance: e.target.value }))} min="0" />
                </div>

                <div className="form-group">
                  <label className="form-label">Ikon</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {WALLET_ICONS.map(icon => (
                      <button key={icon} type="button"
                        onClick={() => setForm(p => ({ ...p, icon }))}
                        style={{
                          width: 38, height: 38, borderRadius: 8, fontSize: 18,
                          border: `2px solid ${form.icon === icon ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.icon === icon ? 'var(--primary)10' : 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Warna</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {WALLET_COLORS.map(color => (
                      <button key={color} type="button"
                        onClick={() => setForm(p => ({ ...p, color }))}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                          outline: form.color === color ? `3px solid ${color}` : '3px solid transparent',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button id="save-wallet-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
