'use client';
import { useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/utils';
import ThemeToggleBtn from '@/app/components/ThemeToggleBtn';
import { useTheme } from '@/app/components/ThemeProvider';

export default function AnggaranPage() {
  const { isDark } = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category_id: '', amount: '', period: 'monthly', start_date: '', end_date: '' });
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯', color: '#1B4332' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [budRes, catRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
      ]);
      const budData = await budRes.json();
      const catData = await catRes.json();
      setBudgets(budData.budgets || []);
      setGoals(budData.goals || []);
      setCategories((catData.categories || []).filter(c => c.type === 'expense'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!budgetForm.category_id || !budgetForm.amount) return setFormError('Pilih kategori dan masukkan jumlah');
    setSaving(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...budgetForm,
          amount: parseFloat(budgetForm.amount),
          start_date: budgetForm.start_date || defaultStart,
          end_date: budgetForm.end_date || defaultEnd,
        }),
      });
      if (res.ok) {
        setShowBudgetModal(false);
        setBudgetForm({ category_id: '', amount: '', period: 'monthly', start_date: '', end_date: '' });
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!goalForm.name || !goalForm.target_amount) return setFormError('Isi nama dan target');
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goalForm, target_amount: parseFloat(goalForm.target_amount), current_amount: parseFloat(goalForm.current_amount || 0) }),
      });
      if (res.ok) {
        setShowGoalModal(false);
        setGoalForm({ name: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯', color: '#1B4332' });
        loadData();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = async (id) => {
    if (!confirm('Hapus anggaran ini?')) return;
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    loadData();
  };

  const deleteGoal = async (id) => {
    if (!confirm('Hapus tujuan ini?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    loadData();
  };

  const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💍', '🎓', '💻', '📱', '🏖️', '👶'];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-breadcrumb">Beranda · Anggaran</span>
          <span className="topbar-title">Anggaran & Tujuan</span>
        </div>
        <div className="topbar-right">
          <ThemeToggleBtn />
          <button id="add-goal-btn" className="btn btn-secondary" onClick={() => { setFormError(''); setShowGoalModal(true); }}>
            + Tujuan
          </button>
          <button id="add-budget-btn" className="btn btn-primary" onClick={() => { setFormError(''); setShowBudgetModal(true); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Anggaran Baru
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Summary */}
        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total Anggaran</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : undefined }}>{formatRupiah(budgets.reduce((s, b) => s + parseFloat(b.amount), 0))}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Terpakai</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : 'var(--expense-color)' }}>
              {formatRupiah(budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0))}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Tujuan Aktif</div>
            <div className="stat-card-value" style={{ color: isDark ? '#000000' : undefined }}>{goals.length} tujuan</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Budgets */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Anggaran per Kategori</div>
                <div className="card-subtitle">Pantau pengeluaran sesuai rencana</div>
              </div>
            </div>
            {loading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : budgets.length > 0 ? (
              <div>
                {budgets.map(b => {
                  const spent = parseFloat(b.spent || 0);
                  const amount = parseFloat(b.amount);
                  const pct = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
                  const isOver = spent > amount;
                  const color = isOver ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : b.category_color || 'var(--primary)';

                  return (
                    <div key={b.id} className="budget-item">
                      <div className="budget-meta">
                        <div className="budget-name">
                          <span>{b.category_icon || '📌'}</span>
                          <span>{b.category_name || 'Kategori'}</span>
                          {isOver && <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Melebihi!</span>}
                        </div>
                        <div className="budget-amounts">
                          <div style={{ fontWeight: 700, color: isDark ? '#000000' : (isOver ? 'var(--danger)' : 'var(--text-primary)') }}>{formatRupiah(spent)}</div>
                          <div style={{ color: 'var(--text-muted)' }}>dari {formatRupiah(amount)}</div>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct.toFixed(0)}% terpakai</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteBudget(b.id)} style={{ color: 'var(--danger)', padding: '2px 6px' }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">◈</div>
                <div className="empty-state-title">Belum ada anggaran</div>
                <div className="empty-state-text">Buat anggaran untuk mengontrol pengeluaran Anda</div>
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Tujuan Keuangan</div>
                <div className="card-subtitle">Tabungan menuju impian Anda</div>
              </div>
            </div>
            {loading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : goals.length > 0 ? (
              <div>
                {goals.map(g => {
                  const current = parseFloat(g.current_amount || 0);
                  const target = parseFloat(g.target_amount);
                  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                  const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div key={g.id} className="budget-item">
                      <div className="budget-meta">
                        <div className="budget-name">
                          <span>{g.icon || '🎯'}</span>
                          <span>{g.name}</span>
                        </div>
                        <div className="budget-amounts">
                          <div style={{ fontWeight: 700, color: isDark ? '#000000' : undefined }}>{formatRupiah(current)}</div>
                          <div style={{ color: 'var(--text-muted)' }}>dari {formatRupiah(target)}</div>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: g.color || 'var(--primary)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {pct.toFixed(0)}% tercapai
                          {daysLeft !== null && ` · ${daysLeft > 0 ? `${daysLeft} hari lagi` : 'Sudah lewat'}`}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteGoal(g.id)} style={{ color: 'var(--danger)', padding: '2px 6px' }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <div className="empty-state-title">Belum ada tujuan</div>
                <div className="empty-state-text">Tambahkan tujuan keuangan Anda</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBudgetModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Buat Anggaran Baru</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBudgetModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBudgetSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select id="budget-cat" className="form-select" value={budgetForm.category_id} onChange={e => setBudgetForm(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Pilih kategori pengeluaran</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batas Anggaran (Rp)</label>
                  <input id="budget-amount" type="number" className="form-input" placeholder="0" min="1" value={budgetForm.amount} onChange={e => setBudgetForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tanggal Mulai</label>
                    <input type="date" className="form-input" value={budgetForm.start_date || defaultStart} onChange={e => setBudgetForm(p => ({ ...p, start_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Selesai</label>
                    <input type="date" className="form-input" value={budgetForm.end_date || defaultEnd} onChange={e => setBudgetForm(p => ({ ...p, end_date: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetModal(false)}>Batal</button>
                <button id="save-budget-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowGoalModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Tambah Tujuan Keuangan</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowGoalModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGoalSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">Nama Tujuan</label>
                  <input id="goal-name" type="text" className="form-input" placeholder="cth: Beli Rumah" value={goalForm.name} onChange={e => setGoalForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ikon</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {GOAL_ICONS.map(icon => (
                      <button key={icon} type="button" onClick={() => setGoalForm(p => ({ ...p, icon }))}
                        style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, border: `2px solid ${goalForm.icon === icon ? 'var(--primary)' : 'var(--border)'}`, background: goalForm.icon === icon ? '#1B433210' : 'white', cursor: 'pointer' }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Tabungan (Rp)</label>
                  <input id="goal-target" type="number" className="form-input" placeholder="0" min="1" value={goalForm.target_amount} onChange={e => setGoalForm(p => ({ ...p, target_amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Saldo Awal (Rp)</label>
                  <input type="number" className="form-input" placeholder="0" min="0" value={goalForm.current_amount} onChange={e => setGoalForm(p => ({ ...p, current_amount: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Target Tanggal (opsional)</label>
                  <input type="date" className="form-input" value={goalForm.deadline} onChange={e => setGoalForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>Batal</button>
                <button id="save-goal-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
