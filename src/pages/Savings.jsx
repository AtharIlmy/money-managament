import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import Icon from '../components/Icon';

const GOAL_CATEGORIES = [
  { label: 'Dana Darurat', icon: '🛡️', color: '#1B4332' },
  { label: 'Liburan & Healing', icon: '✈️', color: '#2D6A4F' },
  { label: 'Kendaraan', icon: '🚗', color: '#E76F51' },
  { label: 'Gadget & Elektronik', icon: '📱', color: '#2A9D8F' },
  { label: 'Rumah & Properti', icon: '🏡', color: '#3D405B' },
  { label: 'Investasi & Masa Depan', icon: '📈', color: '#40916C' },
  { label: 'Pendidikan', icon: '🎓', color: '#264653' },
  { label: 'Ibadah / Umroh', icon: '🕋', color: '#E9C46A' },
  { label: 'Lainnya', icon: '🎯', color: '#52796F' },
];

export default function Savings() {
  const { authFetch } = useAuth();
  const [goals, setGoals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalLogs, setGoalLogs] = useState([]);

  // Forms
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    category: 'Dana Darurat',
    icon: '🛡️',
    color: '#1B4332',
    wallet_id: '',
  });

  const [transForm, setTransForm] = useState({
    amount: '',
    wallet_id: '',
    note: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsRes, walletsRes] = await Promise.all([
        authFetch('/api/goals'),
        authFetch('/api/wallets'),
      ]);

      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (walletsRes.ok) {
        const walData = await walletsRes.json();
        setWallets(walData);
        if (walData.length > 0 && !transForm.wallet_id) {
          setTransForm((f) => ({ ...f, wallet_id: walData[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load savings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.target_amount) {
      return setError('Nama impian dan target nominal wajib diisi');
    }

    setSaving(true);
    try {
      const res = await authFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setForm({
          name: '',
          target_amount: '',
          current_amount: '',
          deadline: '',
          category: 'Dana Darurat',
          icon: '🛡️',
          color: '#1B4332',
          wallet_id: '',
        });
        loadData();
      } else {
        const d = await res.json();
        setError(d.error || 'Gagal membuat impian tabungan');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // Deposit into Goal
  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    if (!transForm.amount || parseFloat(transForm.amount) <= 0) {
      return setError('Masukkan jumlah nominal valid');
    }

    setSaving(true);
    try {
      const res = await authFetch(`/api/goals/${selectedGoal.id}/deposit`, {
        method: 'POST',
        body: JSON.stringify(transForm),
      });

      if (res.ok) {
        setShowDepositModal(false);
        setTransForm({ amount: '', wallet_id: wallets[0]?.id || '', note: '' });
        loadData();
      } else {
        const d = await res.json();
        setError(d.error || 'Gagal menyetor tabungan');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // Withdraw from Goal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    if (!transForm.amount || parseFloat(transForm.amount) <= 0) {
      return setError('Masukkan jumlah nominal valid');
    }

    setSaving(true);
    try {
      const res = await authFetch(`/api/goals/${selectedGoal.id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify(transForm),
      });

      if (res.ok) {
        setShowWithdrawModal(false);
        setTransForm({ amount: '', wallet_id: wallets[0]?.id || '', note: '' });
        loadData();
      } else {
        const d = await res.json();
        setError(d.error || 'Gagal menarik tabungan');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  // View Logs
  const handleViewLogs = async (goal) => {
    setSelectedGoal(goal);
    try {
      const res = await authFetch(`/api/goals/${goal.id}/logs`);
      if (res.ok) {
        setGoalLogs(await res.json());
      }
      setShowLogsModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Hapus impian tabungan ini?')) return;
    try {
      await authFetch(`/api/goals/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Gagal menghapus tabungan');
    }
  };

  const totalSaved = goals.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount || 0), 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Tabungan</span>
          <span className="topbar-title">Celengan & Impian Finansial</span>
        </div>
        <div className="topbar-right">
          <button
            id="add-goal-top-btn"
            className="btn btn-primary"
            onClick={() => {
              setError('');
              setShowCreateModal(true);
            }}
          >
            + Buat Impian Tabungan
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Signature Biru Dongker Hero Banner */}
        <div className="navy-banner">
          <div className="navy-banner-left">
            <h1 className="navy-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="account_balance" size={26} /> Celengan &amp; Impian Finansial
            </h1>
            <p className="navy-banner-subtitle">
              Capai tujuan finansial, liburan, dan masa depan dengan tabungan terencana.
            </p>
            <div className="navy-banner-actions">
              <button
                className="navy-banner-btn primary"
                onClick={() => {
                  setError('');
                  setShowCreateModal(true);
                }}
              >
                + Buat Impian Tabungan
              </button>
              <span className="navy-banner-btn">
                {goals.length} Impian Aktif
              </span>
            </div>
          </div>

          <div className="navy-banner-right">
            <div className="navy-banner-stat-box">
              <div className="navy-banner-stat-label">Total Tabungan Terkumpul</div>
              <div className="navy-banner-stat-value">{formatRupiah(totalSaved)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {overallPercentage}% dari target {formatRupiah(totalTarget)}
              </div>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Daftar Tabungan & Rencana Impian
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Memuat data tabungan...
            </div>
          ) : goals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 18 }}>
              {goals.map((g) => {
                const current = parseFloat(g.current_amount || 0);
                const target = parseFloat(g.target_amount || 1);
                const pct = g.percentage || 0;
                const isComplete = g.isCompleted;

                return (
                  <div key={g.id} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              background: `${g.color || '#1B4332'}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24,
                            }}
                          >
                            {g.icon || <Icon name="track_changes" size={24} color={g.color || 'var(--primary)'} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                              {g.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {g.category || 'Tabungan'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleViewLogs(g)}
                            style={{ background: 'none', fontSize: 16, cursor: 'pointer', padding: 4 }}
                            title="Riwayat Setoran/Penarikan"
                          >
                            <Icon name="history" size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            style={{ background: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: 4 }}
                            title="Hapus Impian"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Amounts & Progress */}
                      <div style={{ marginTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Terkumpul</span>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                              {formatRupiah(current)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target</span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {formatRupiah(target)}
                            </div>
                          </div>
                        </div>

                        <div className="progress-bar" style={{ height: 10 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: isComplete ? 'var(--success)' : (g.color || 'var(--primary)'),
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                          <span style={{ color: isComplete ? 'var(--success)' : 'var(--primary)' }}>
                            {pct}% Tercapai
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {isComplete ? 'Target Tercapai! 🎉' : `Sisa ${formatRupiah(g.remainingAmount)}`}
                          </span>
                        </div>
                      </div>

                      {/* Smart Recommendations Box */}
                      {g.deadline && !isComplete && (
                        <div
                          style={{
                            marginTop: 14,
                            padding: '10px 12px',
                            background: 'var(--bg)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span>Tenggat: <strong>{formatDateShort(g.deadline)}</strong></span>
                            <span>{g.daysRemaining > 0 ? `${g.daysRemaining} hari lagi` : 'Lewat tenggat'}</span>
                          </div>
                          {g.monthlyRecommendation > 0 && (
                            <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                             <Icon name="lightbulb" size={14} color="var(--warning)" style={{ marginRight: 4 }} /> Sisihkan ~{formatRupiah(g.monthlyRecommendation)}/bulan (~{formatRupiah(g.dailyRecommendation)}/hari)
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          setError('');
                          setSelectedGoal(g);
                          setTransForm({ amount: '', wallet_id: wallets[0]?.id || '', note: '' });
                          setShowDepositModal(true);
                        }}
                      >
                        + Setor Dana
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={current <= 0}
                        onClick={() => {
                          setError('');
                          setSelectedGoal(g);
                          setTransForm({ amount: '', wallet_id: wallets[0]?.id || '', note: '' });
                          setShowWithdrawModal(true);
                        }}
                      >
                        ↩ Tarik Dana
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="account_balance" size={40} /></div>
              <div className="empty-state-title">Belum ada celengan tabungan</div>
              <div className="empty-state-text">
                Rencanakan tujuan finansial Anda seperti Dana Darurat, Liburan, atau Kendaraan dengan menekan tombol di atas.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Buat Impian Tabungan Baru */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Buka Tabungan Impian Baru</div>
              <button style={{ background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateGoal}>
              <div className="form-group">
                <label className="form-label">Kategori Tabungan</label>
                <div className="savings-category-grid">
                  {GOAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.label, icon: cat.icon, color: cat.color }))}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        textAlign: 'center',
                        border: form.category === cat.label ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: form.category === cat.label ? '#F5F4F0' : 'white',
                        fontWeight: form.category === cat.label ? 700 : 500,
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{cat.icon}</div>
                      <div>{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Impian / Tabungan</label>
                <input
                  type="text"
                  placeholder="Contoh: Dana Darurat 6 Bulan, Beli Vespa Matic"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Nominal yang Ingin Dicapai (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 15000000"
                  className="form-input"
                  value={form.target_amount}
                  onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Setoran Awal (Rp, Opsional)</label>
                <input
                  type="number"
                  placeholder="Contoh: 500000"
                  className="form-input"
                  value={form.current_amount}
                  onChange={(e) => setForm((f) => ({ ...f, current_amount: e.target.value }))}
                />
              </div>

              {parseFloat(form.current_amount) > 0 && (
                <div className="form-group">
                  <label className="form-label">Ambil Setoran Awal dari Dompet</label>
                  <select
                    className="form-input"
                    value={form.wallet_id}
                    onChange={(e) => setForm((f) => ({ ...f, wallet_id: e.target.value }))}
                  >
                    <option value="">Pilih Dompet Sumber</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name} (Saldo: {formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Target Tanggal Selesai (Deadline)</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Mulai Menabung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Setor Tabungan */}
      {showDepositModal && selectedGoal && (
        <div className="modal-backdrop" onClick={() => setShowDepositModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                Setor Dana ke "{selectedGoal.name}"
              </div>
              <button style={{ background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleDeposit}>
              <div className="form-group">
                <label className="form-label">Nominal Setoran (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 250000"
                  className="form-input"
                  value={transForm.amount}
                  onChange={(e) => setTransForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Potong dari Dompet / Rekening</label>
                <select
                  className="form-input"
                  value={transForm.wallet_id}
                  onChange={(e) => setTransForm((f) => ({ ...f, wallet_id: e.target.value }))}
                  required
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Sisa uang belanja minggu ini"
                  className="form-input"
                  value={transForm.note}
                  onChange={(e) => setTransForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDepositModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Memproses...' : 'Setor Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Tarik Tabungan */}
      {showWithdrawModal && selectedGoal && (
        <div className="modal-backdrop" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                Tarik Dana dari "{selectedGoal.name}"
              </div>
              <button style={{ background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label className="form-label">
                  Nominal Penarikan (Tersedia: {formatRupiah(selectedGoal.current_amount)})
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 500000"
                  className="form-input"
                  max={selectedGoal.current_amount}
                  value={transForm.amount}
                  onChange={(e) => setTransForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kembalikan ke Dompet / Rekening</label>
                <select
                  className="form-input"
                  value={transForm.wallet_id}
                  onChange={(e) => setTransForm((f) => ({ ...f, wallet_id: e.target.value }))}
                  required
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Alasan Penarikan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Kebutuhan darurat / target terpenuhi"
                  className="form-input"
                  value={transForm.note}
                  onChange={(e) => setTransForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Memproses...' : 'Tarik ke Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Riwayat Logs */}
      {showLogsModal && selectedGoal && (
        <div className="modal-backdrop" onClick={() => setShowLogsModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                Riwayat Tabungan: {selectedGoal.name}
              </div>
              <button style={{ background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowLogsModal(false)}>✕</button>
            </div>

            {goalLogs.length > 0 ? (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipe</th>
                      <th>Dompet</th>
                      <th>Catatan</th>
                      <th style={{ textAlign: 'right' }}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span className={`badge ${log.type === 'deposit' ? 'badge-income' : 'badge-expense'}`}>
                            {log.type === 'deposit' ? 'Setoran' : 'Penarikan'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {log.wallet_name || '-'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {log.note || '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          <span style={{ color: log.type === 'deposit' ? 'var(--primary)' : 'var(--expense-color)' }}>
                            {log.type === 'deposit' ? '+' : '-'}{formatRupiah(log.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon"><Icon name="assignment" size={40} /></div>
                <div className="empty-state-title">Belum ada riwayat setoran</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowLogsModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
