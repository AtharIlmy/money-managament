import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';

export default function Budgets() {
  const { authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category_id: '', amount: '' });
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    icon: '🎯',
    color: '#0E2038',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [budRes, goalRes, catRes] = await Promise.all([
        authFetch('/api/budgets'),
        authFetch('/api/goals'),
        authFetch('/api/categories?type=expense'),
      ]);

      if (budRes.ok) setBudgets(await budRes.json());
      if (goalRes.ok) setGoals(await goalRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      console.error('Failed to load budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!budgetForm.category_id || !budgetForm.amount) {
      return setFormError('Pilih kategori dan tentukan nominal');
    }

    setSaving(true);
    try {
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
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan anggaran');
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!goalForm.name || !goalForm.target_amount) {
      return setFormError('Nama target dan target nominal wajib diisi');
    }

    setSaving(true);
    try {
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
          color: '#0E2038',
        });
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan impian');
      }
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Hapus anggaran kategori ini?')) return;
    try {
      await authFetch(`/api/budgets/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Gagal menghapus anggaran');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Hapus impian finansial ini?')) return;
    try {
      await authFetch(`/api/goals/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Gagal menghapus target');
    }
  };

  const handleAddSavings = async (goal) => {
    const input = prompt(`Tambah tabungan untuk "${goal.name}" (Rp):`, '500000');
    if (!input || isNaN(parseFloat(input))) return;
    const addAmt = parseFloat(input);
    try {
      await authFetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          current_amount: parseFloat(goal.current_amount || 0) + addAmt,
        }),
      });
      loadData();
    } catch (err) {
      alert('Gagal mengupdate tabungan');
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

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
            Anggaran
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Data tersimpan
          </div>
          <NotificationButton />
          <button
            id="add-budget-btn"
            className="btn btn-primary"
            style={{ padding: '7px 16px', fontSize: 12.5 }}
            onClick={() => setShowBudgetModal(true)}
          >
            + Buat Anggaran
          </button>
          <button
            id="add-goal-btn"
            className="btn btn-secondary"
            style={{ padding: '7px 16px', fontSize: 12.5 }}
            onClick={() => setShowGoalModal(true)}
          >
            <Icon name="track_changes" size={16} style={{ marginRight: 4 }} /> Target Impian
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Signature Biru Dongker Hero Banner (Matching Mockup) */}
        <div className="navy-banner">
          <div className="navy-banner-left">
            <h1 className="navy-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="track_changes" size={26} /> Anggaran &amp; Tujuan
            </h1>
            <p className="navy-banner-subtitle">
              Kendalikan batas pengeluaran bulanan dan wujudkan impian tabungan Anda.
            </p>
            <div className="navy-banner-actions">
              <button
                className="navy-banner-btn primary"
                onClick={() => setShowBudgetModal(true)}
              >
                + Pasang Anggaran
              </button>
              <button
                className="navy-banner-btn"
                onClick={() => setShowGoalModal(true)}
              >
                + Buat Target Impian
              </button>
            </div>
          </div>

          <div className="navy-banner-right">
            <div className="navy-banner-stat-box">
              <div className="navy-banner-stat-label">Sisa Kuota Anggaran</div>
              <div className="navy-banner-stat-value">{formatRupiah(remainingBudget)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Dari total alokasi {formatRupiah(totalBudget)}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-card-label">
              <span>Total Alokasi Anggaran</span>
              <Icon name="assignment" size={18} color="var(--primary)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
              {formatRupiah(totalBudget)}
            </div>
            <div className="stat-card-change">
              {budgets.length} Kategori dialokasikan
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Realisasi Pengeluaran</span>
              <Icon name="payments" size={18} color="var(--expense-color)" />
            </div>
            <div className="stat-card-value" style={{ color: 'var(--expense-color)' }}>
              {formatRupiah(totalSpent)}
            </div>
            <div className="stat-card-change down">
              ↓ {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% kuota terpakai` : 'Belum ada data'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span>Sisa Dana Aman</span>
              <Icon name="shield" size={18} color="var(--income-color)" />
            </div>
            <div
              className="stat-card-value"
              style={{ color: remainingBudget > 0 ? 'var(--income-color)' : 'var(--danger)' }}
            >
              {formatRupiah(remainingBudget)}
            </div>
            <div className="stat-card-change">
              {remainingBudget > 0 ? '✓ Dalam batas anggaran' : '⚠ Anggaran terlampaui'}
            </div>
          </div>
        </div>

        {/* Section 1: Budgets per Category (Grid of Cards) */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Anggaran per Kategori
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowBudgetModal(true)}>
              + Tambah Kategori
            </button>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner" />
            </div>
          ) : budgets.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {budgets.map((b) => {
                const spent = parseFloat(b.spent || 0);
                const limit = parseFloat(b.amount || 1);
                const pct = Math.min(Math.round((spent / limit) * 100), 100);
                const isOver = spent > limit;

                return (
                  <div key={b.id} className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: 'var(--primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                        >
                          {b.category_icon || <Icon name="label" size={22} color="var(--primary)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                            {b.category_name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alokasi Bulanan</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        style={{
                          background: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 16,
                          cursor: 'pointer',
                        }}
                        onMouseOver={(e) => (e.target.style.color = 'var(--danger)')}
                        onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
                        title="Hapus anggaran"
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>

                    <div style={{ marginTop: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Terpakai: {formatRupiah(spent)}</span>
                        <span style={{ fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--primary)' }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: isOver ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--primary)',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 11.5,
                          color: 'var(--text-muted)',
                          marginTop: 8,
                        }}
                      >
                        <span>Maksimal: {formatRupiah(limit)}</span>
                        <span style={{ fontWeight: 600, color: isOver ? 'var(--danger)' : 'var(--income-color)' }}>
                          {isOver ? `Over ${formatRupiah(spent - limit)}` : `Sisa ${formatRupiah(limit - spent)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="analytics" size={40} /></div>
              <div className="empty-state-title">Belum ada batasan anggaran</div>
              <div className="empty-state-text">
                Buat rencana anggaran bulanan untuk mengontrol pengeluaran kategori belanja
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Goals / Savings Impian */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Tujuan Tabungan & Impian Finansial
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalModal(true)}>
              + Buat Impian
            </button>
          </div>

          {goals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {goals.map((g) => {
                const current = parseFloat(g.current_amount || 0);
                const target = parseFloat(g.target_amount || 1);
                const pct = Math.min(Math.round((current / target) * 100), 100);

                return (
                  <div key={g.id} className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: 'var(--primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                        >
                          {g.icon || <Icon name="track_changes" size={22} color="var(--primary)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                            {g.name}
                          </div>
                          {g.deadline && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Target: {formatDateShort(g.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        style={{
                          background: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 16,
                          cursor: 'pointer',
                        }}
                        onMouseOver={(e) => (e.target.style.color = 'var(--danger)')}
                        onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
                        title="Hapus impian"
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {formatRupiah(current)}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>dari {formatRupiah(target)}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%`, background: 'var(--primary)' }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 14,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                          {pct}% Terkumpul
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAddSavings(g)}
                        >
                          + Tambah Tabungan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="track_changes" size={40} /></div>
              <div className="empty-state-title">Belum ada target impian</div>
              <div className="empty-state-text">
                Rencanakan pembelian rumah, liburan, atau dana darurat dengan tabungan terarah
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Anggaran */}
      {showBudgetModal && (
        <div className="modal-backdrop" onClick={() => setShowBudgetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Pasang Batas Anggaran</div>
              <button
                style={{ background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowBudgetModal(false)}
              >
                ✕
              </button>
            </div>
            {formError && <div className="alert alert-error">⚠ {formError}</div>}
            <form onSubmit={handleBudgetSubmit}>
              <div className="form-group">
                <label className="form-label">Kategori Pengeluaran</label>
                <select
                  className="form-select"
                  value={budgetForm.category_id}
                  onChange={(e) => setBudgetForm((f) => ({ ...f, category_id: e.target.value }))}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Batas Anggaran Bulanan (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 1500000"
                  className="form-input"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBudgetModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Target */}
      {showGoalModal && (
        <div className="modal-backdrop" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Buat Target Tabungan Impian</div>
              <button
                style={{ background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowGoalModal(false)}
              >
                ✕
              </button>
            </div>
            {formError && <div className="alert alert-error">⚠ {formError}</div>}
            <form onSubmit={handleGoalSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Impian</label>
                <input
                  type="text"
                  placeholder="Contoh: Dana Darurat, Liburan Jepang, Mobil Baru"
                  className="form-input"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 20000000"
                  className="form-input"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm((f) => ({ ...f, target_amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Saldo Awal yang Sudah Terkumpul (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="form-input"
                  value={goalForm.current_amount}
                  onChange={(e) => setGoalForm((f) => ({ ...f, current_amount: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Batas Waktu (Deadline Target)</label>
                <input
                  type="date"
                  className="form-input"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowGoalModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
