import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';

// Rekomendasi jumlah bulan dana darurat berdasarkan status
const MONTH_OPTIONS = [
  { months: 3, label: '3 Bulan', desc: 'Lajang / tanpa tanggungan', icon: '👤' },
  { months: 6, label: '6 Bulan', desc: 'Menikah / 1–2 tanggungan', icon: '👫' },
  { months: 9, label: '9 Bulan', desc: 'Keluarga dengan anak', icon: '👨‍👩‍👧' },
  { months: 12, label: '12 Bulan', desc: 'Wiraswasta / freelancer', icon: '💼' },
];

const TIPS = [
  { icon: '🏦', title: 'Pisahkan rekening', desc: 'Simpan dana darurat di rekening berbeda agar tidak tergoda digunakan.' },
  { icon: '📅', title: 'Otomatisasi tabungan', desc: 'Sisihkan otomatis setiap gajian, minimal 10–20% dari penghasilan.' },
  { icon: '🚫', title: 'Gunakan hanya darurat', desc: 'Pemutusan kerja, biaya medis mendesak, atau perbaikan kendaraan.' },
  { icon: '🔄', title: 'Isi kembali segera', desc: 'Jika terpakai, prioritaskan mengisi kembali sebelum pengeluaran lain.' },
];

export default function EmergencyFund() {
  const { authFetch } = useAuth();
  const { isHidden, maskAmount } = usePrivacy();

  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Konfigurasi dana darurat
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    return parseFloat(localStorage.getItem('ef_monthly_expense') || '0') || 0;
  });
  const [targetMonths, setTargetMonths] = useState(() => {
    return parseInt(localStorage.getItem('ef_target_months') || '6', 10);
  });
  const [selectedWalletId, setSelectedWalletId] = useState(() => {
    return localStorage.getItem('ef_wallet_id') || '';
  });
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({
    monthlyExpense: '',
    targetMonths: 6,
    walletId: '',
  });

  const targetAmount = monthlyExpense * targetMonths;

  // Saldo dari dompet yang dipilih sebagai dana darurat
  const efWallet = wallets.find((w) => String(w.id) === String(selectedWalletId));
  const currentAmount = efWallet ? parseFloat(efWallet.balance) : 0;
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const monthsCovered = monthlyExpense > 0 ? currentAmount / monthlyExpense : 0;

  // Warna progress
  const getProgressColor = (pct) => {
    if (pct >= 100) return '#059669';
    if (pct >= 60) return '#2563EB';
    if (pct >= 30) return '#F59E0B';
    return '#EF4444';
  };
  const progressColor = getProgressColor(progress);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [walRes, txRes] = await Promise.all([
        authFetch('/api/wallets'),
        authFetch('/api/transactions?limit=200'),
      ]);
      if (walRes.ok) {
        const data = await walRes.json();
        setWallets(data);
        // Auto-select first wallet jika belum ada
        if (!selectedWalletId && data.length > 0) {
          setSelectedWalletId(String(data[0].id));
          localStorage.setItem('ef_wallet_id', String(data[0].id));
        }
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to load emergency fund data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWalletId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kalkulasi rata-rata pengeluaran bulanan dari 3 bulan terakhir
  const calcAvgMonthlyExpense = () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const expenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      return d >= threeMonthsAgo;
    });
    const total = expenses.reduce((s, t) => s + parseFloat(t.amount), 0);
    return Math.round(total / 3);
  };

  const handleOpenSetup = () => {
    setSetupForm({
      monthlyExpense: String(monthlyExpense || ''),
      targetMonths: targetMonths,
      walletId: selectedWalletId,
    });
    setShowSetup(true);
  };

  const handleSaveSetup = () => {
    const me = parseFloat(setupForm.monthlyExpense) || 0;
    const tm = parseInt(setupForm.targetMonths, 10) || 6;
    const wid = setupForm.walletId;
    setMonthlyExpense(me);
    setTargetMonths(tm);
    setSelectedWalletId(wid);
    localStorage.setItem('ef_monthly_expense', String(me));
    localStorage.setItem('ef_target_months', String(tm));
    localStorage.setItem('ef_wallet_id', String(wid));
    setShowSetup(false);
  };

  const avgExpense = calcAvgMonthlyExpense();

  // Transaksi di dompet yang dipilih
  const walletTransactions = transactions
    .filter((t) => String(t.wallet_id) === String(selectedWalletId))
    .slice(0, 8);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Ruang personal</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&gt;</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Dana Darurat</span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationButton />
          <button
            id="setup-ef-btn"
            className="btn btn-primary"
            style={{ padding: '7px 16px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleOpenSetup}
          >
            <Icon name="settings" size={15} />
            Atur Target
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <>
            {/* Hero Card - Progress Utama */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0E2038 0%, #1C3B66 60%, #0E3A2A 100%)',
                borderRadius: 20,
                padding: '32px 28px',
                marginBottom: 20,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(14,32,56,0.25)',
              }}
            >
              {/* Decorative circle */}
              <div style={{
                position: 'absolute', right: -40, top: -40,
                width: 220, height: 220, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', right: 40, bottom: -60,
                width: 140, height: 140, borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>🛡️</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Dana Darurat Saya</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {efWallet?.name || 'Belum ada dompet dipilih'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 4 }}>
                    {isHidden ? '••••••' : formatRupiah(currentAmount)}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                    Target: <span style={{ color: '#A7F3D0', fontWeight: 700 }}>
                      {isHidden ? '••••••' : formatRupiah(targetAmount)}
                    </span>
                    {targetAmount > 0 && (
                      <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.4)' }}>
                        ({targetMonths} bulan × {isHidden ? '••••••' : formatRupiah(monthlyExpense)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Circular progress */}
                <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={progressColor}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{Math.round(progress)}%</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>tercapai</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 24 }}>
                <div style={{
                  height: 8, borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                    borderRadius: 999,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {monthsCovered.toFixed(1)} bulan terlindungi
                  </span>
                  {remaining > 0 && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      Kurang: <span style={{ color: '#FCA5A5', fontWeight: 700 }}>
                        {isHidden ? '••••••' : formatRupiah(remaining)}
                      </span>
                    </span>
                  )}
                  {remaining === 0 && targetAmount > 0 && (
                    <span style={{ fontSize: 12, color: '#A7F3D0', fontWeight: 700 }}>
                      ✓ Target tercapai!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stat cards row */}
            <div className="stat-cards" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="stat-card">
                <div className="stat-card-label">
                  <span>Dana Terkumpul</span>
                  <Icon name="savings" size={18} color="var(--income-color)" />
                </div>
                <div className="stat-card-value" style={{ color: 'var(--income-color)' }}>
                  {maskAmount(formatRupiah(currentAmount))}
                </div>
                <div className="stat-card-change up">Saldo dompet terpilih</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">
                  <span>Target Akhir</span>
                  <Icon name="flag" size={18} color="var(--primary)" />
                </div>
                <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
                  {maskAmount(formatRupiah(targetAmount))}
                </div>
                <div className="stat-card-change">{targetMonths} bulan pengeluaran</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">
                  <span>Rata-rata Pengeluaran</span>
                  <Icon name="trending_up" size={18} color="#F59E0B" />
                </div>
                <div className="stat-card-value" style={{ color: '#D97706' }}>
                  {maskAmount(formatRupiah(avgExpense || monthlyExpense))}
                </div>
                <div className="stat-card-change">3 bulan terakhir</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">
                  <span>Perlindungan</span>
                  <Icon name="shield" size={18} color={progressColor} />
                </div>
                <div className="stat-card-value" style={{ color: progressColor }}>
                  {monthsCovered.toFixed(1)} bln
                </div>
                <div className="stat-card-change">
                  {progress >= 100 ? '✓ Aman sepenuhnya' : progress >= 60 ? 'Cukup, terus isi' : 'Perlu ditambah'}
                </div>
              </div>
            </div>

            <div className="ef-tips-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Panduan bulan */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="calendar_month" size={18} color="var(--primary)" />
                  Panduan Berapa Bulan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MONTH_OPTIONS.map((opt) => (
                    <div
                      key={opt.months}
                      onClick={() => {
                        setTargetMonths(opt.months);
                        localStorage.setItem('ef_target_months', String(opt.months));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: targetMonths === opt.months ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: targetMonths === opt.months ? 'var(--primary-50)' : 'var(--bg-card2)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{opt.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{opt.label}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{opt.desc}</div>
                      </div>
                      {targetMonths === opt.months && (
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'var(--primary)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon name="check" size={12} style={{ color: '#fff' }} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="lightbulb" size={18} color="#F59E0B" />
                  Tips Dana Darurat
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {TIPS.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: 20, width: 36, height: 36, borderRadius: 10,
                        background: 'var(--bg-card2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{tip.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {tip.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {tip.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daftar Dompet */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="account_balance_wallet" size={18} color="var(--primary)" />
                Pilih Dompet Dana Darurat
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {wallets.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedWalletId(String(w.id));
                      localStorage.setItem('ef_wallet_id', String(w.id));
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: String(selectedWalletId) === String(w.id)
                        ? '2px solid var(--primary)'
                        : '1px solid var(--border)',
                      background: String(selectedWalletId) === String(w.id)
                        ? 'var(--primary-50)'
                        : 'var(--bg-card2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{w.icon || '💰'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{w.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {maskAmount(formatRupiah(w.balance))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Riwayat transaksi dompet ini */}
            {efWallet && (
              <div className="card">
                <div style={{ padding: '16px 20px 0', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="history" size={18} color="var(--text-secondary)" />
                  Riwayat Transaksi — {efWallet.name}
                </div>
                {walletTransactions.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Keterangan</th>
                          <th>Tanggal</th>
                          <th style={{ textAlign: 'right' }}>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletTransactions.map((tx) => {
                          const isIncome = tx.type === 'income';
                          return (
                            <tr key={tx.id}>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                  {tx.description || tx.category_name || 'Transaksi'}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                  {tx.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                                </div>
                              </td>
                              <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`tx-amount ${isIncome ? 'income' : 'expense'}`} style={{ fontWeight: 700 }}>
                                  {isIncome ? '+ ' : '- '}
                                  {maskAmount(formatRupiah(tx.amount))}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Icon name="history" size={36} /></div>
                    <div className="empty-state-title">Belum ada transaksi</div>
                    <div className="empty-state-text">Transaksi di dompet ini akan muncul di sini</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Setup */}
      {showSetup && (
        <div className="modal-backdrop" onClick={() => setShowSetup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">🛡️ Atur Target Dana Darurat</div>
              <button
                style={{ background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowSetup(false)}
              >✕</button>
            </div>

            <div style={{ padding: '0 0 16px' }}>
              {/* Auto-calc suggestion */}
              {avgExpense > 0 && (
                <div style={{
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-100)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                      💡 Saran berdasarkan riwayat
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Rata-rata pengeluaran 3 bulan terakhir: <strong>{formatRupiah(avgExpense)}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: 11.5, padding: '5px 12px', whiteSpace: 'nowrap' }}
                    onClick={() => setSetupForm((f) => ({ ...f, monthlyExpense: String(avgExpense) }))}
                  >
                    Pakai ini
                  </button>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Pengeluaran Bulanan Rata-rata (Rp)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Contoh: 3000000"
                  value={setupForm.monthlyExpense}
                  onChange={(e) => setSetupForm((f) => ({ ...f, monthlyExpense: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Jumlah Bulan</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[3, 6, 9, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`btn ${setupForm.targetMonths === m ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 4px', fontSize: 13 }}
                      onClick={() => setSetupForm((f) => ({ ...f, targetMonths: m }))}
                    >
                      {m} bln
                    </button>
                  ))}
                </div>
                {setupForm.monthlyExpense && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8 }}>
                    Target: <strong style={{ color: 'var(--primary)' }}>
                      {formatRupiah((parseFloat(setupForm.monthlyExpense) || 0) * setupForm.targetMonths)}
                    </strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Dompet Dana Darurat</label>
                <select
                  className="form-select"
                  value={setupForm.walletId}
                  onChange={(e) => setSetupForm((f) => ({ ...f, walletId: e.target.value }))}
                >
                  <option value="">Pilih dompet...</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon} {w.name} — {formatRupiah(w.balance)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSetup(false)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={handleSaveSetup}
                disabled={!setupForm.monthlyExpense || !setupForm.walletId}
              >
                ✓ Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
