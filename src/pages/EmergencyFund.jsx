import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { formatRupiah, formatDateShort } from '../lib/utils';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

/**
 * Dana Darurat (Emergency Fund)
 *
 * Halaman khusus untuk merencanakan dan memantau dana darurat.
 * Target rekomendasi: 3-6 bulan pengeluaran penting.
 * Halaman ini bersifat read-only (kalkulator) dan menavigasi ke /tabungan
 * untuk membuat target tabungan permanen.
 */
export default function EmergencyFund() {
  const { isHidden, maskAmount } = usePrivacy();
  const [form, setForm] = useState({
    monthlyExpense: '',
    months: '3',
    currentSaved: '',
  });
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // Hitung target dana darurat secara real-time
  useEffect(() => {
    const expense = parseFloat(form.monthlyExpense);
    const months = parseFloat(form.months) || 0;
    const current = parseFloat(form.currentSaved) || 0;

    if (!isNaN(expense) && expense > 0 && months > 0) {
      const target = expense * months;
      const shortfall = Math.max(0, target - current);
      const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
      setResult({
        target,
        current,
        shortfall,
        progress,
        months,
      });
    } else {
      setResult(null);
    }
  }, [form]);

  const monthlyExpense = parseFloat(form.monthlyExpense) || 0;
  const months = parseFloat(form.months) || 0;
  const currentSaved = parseFloat(form.currentSaved) || 0;
  const target = monthlyExpense * months;
  const shortfall = Math.max(0, target - currentSaved);
  const progress = target > 0 ? Math.min(100, (currentSaved / target) * 100) : 0;

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Navigasi ke halaman tabungan untuk membuat target tabungan permanen
    window.location.href = '/tabungan';
  };

  const monthsOptions = [3, 6, 9, 12];

  return (
    <>
      {/* Topbar — standard pattern */}
      <header className="topbar dashboard-topbar">
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Ruang personal</span>
          <span style={{ color: 'var(--text-muted, #94A3B8)' }}>·</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>Dana Darurat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Data tersimpan
          </div>
          <NotificationButton />
          <ThemeToggleBtn />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary, #64748B)', fontWeight: 500 }}>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </header>

      <div className="page-content" style={{ padding: '24px 28px' }}>
        {/* Hero Banner */}
        <div className="navy-banner" style={{ borderRadius: 18, padding: '24px 28px', alignItems: 'center', overflow: 'visible', position: 'relative', zIndex: 30 }}>
          <div className="navy-banner-left" style={{ flex: 1, position: 'relative', zIndex: 40 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.4px' }}>
              Dana Darurat
            </h1>
            <p className="navy-banner-subtitle" style={{ marginBottom: 0 }}>
              Dana sisa untuk krisis, bukan untuk gaya hidup. Target umum:{' '}
              <strong style={{ color: '#BFDBFE' }}>3–6 bulan pengeluaran penting</strong>.
            </p>
          </div>
          <div className="navy-banner-right">
            <div
              className="navy-banner-stat-box"
              style={{ background: '#FAFAFC', border: '1px solid var(--border)' }}
            >
              <div className="navy-banner-stat-label">Rekomendasi target (3 bulan)</div>
              <div className="navy-banner-stat-value" style={{ color: 'var(--primary)' }}>
                {monthlyExpense > 0 ? formatRupiah(monthlyExpense * 3) : 'Rp0'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {monthlyExpense > 0 ? `Dari pengeluaran ~${formatRupiah(monthlyExpense)}/bulan` : 'Masukkan pengeluaran bulanan'}
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Card */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Icon name="trending_up" size={18} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Kalkulator Dana Darurat</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 6 }}>Pengeluaran bulanan (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 8000000"
                value={form.monthlyExpense}
                onChange={(e) => setForm((f) => ({ ...f, monthlyExpense: e.target.value }))}
                min="0"
                step="100000"
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: 6 }}>Jumlah bulan (3-6)</label>
              <select
                className="form-select"
                value={form.months}
                onChange={(e) => setForm((f) => ({ ...f, months: e.target.value }))}
              >
                {monthsOptions.map((m) => (
                  <option key={m} value={m}>
                    {m} bulan
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 6 }}>Jumlah terkumpul (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 3000000"
                value={form.currentSaved}
                onChange={(e) => setForm((f) => ({ ...f, currentSaved: e.target.value }))}
                min="0"
                step="100000"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Bantuan:</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, currentSaved: f.currentSaved === 0 ? '5000000' : '0' }))}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                + Rp 5jt
              </button>
            </div>
          </div>

          {result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Kemajuan kumpul:</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
                  {progress.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 12, marginTop: 4 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, background: progress === 100 ? 'var(--success)' : 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14, textAlign: 'center' }}>
                <div style={{ backgroundColor: 'var(--bg-card2)', borderRadius: 12, padding: '12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{formatRupiah(target)}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card2)', borderRadius: 12, padding: '12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tersisa</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: shortfall > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 2 }}>
                    {formatRupiah(shortfall)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="info" size={14} color="var(--text-muted)" />
                    {currentSaved > 0
                      ? `Dari target kamu sudah terkumpul Rp${currentSaved.toLocaleString('id-ID')}`
                      : 'Belum ada data terkumpul'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, currentSaved: 0 }))}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: '3 bulan', value: 3, icon: '⏱', color: '#10B981' },
                { label: '6 bulan', value: 6, icon: '⏳', color: '#F59E0B' },
                { label: '9 bulan', value: 9, icon: '📆', color: '#8B5CF6' },
                { label: '12 bulan', value: 12, icon: '🗓️', color: '#EC4899' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, months: String(m.value) }))}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: form.months === String(m.value) ? 'var(--primary)' : 'var(--bg-card)',
                    color: form.months === String(m.value) ? '#FFFFFF' : 'var(--text-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onMouseOver={(e) => {
                    if (form.months !== String(m.value)) e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseOut={(e) => {
                    if (form.months !== String(m.value)) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{m.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{m.label}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 14,
                padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Icon name="lightbulb" size={16} style={{ color: 'var(--warning)' }} />
                Tips cerdas kumpulkan
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Setrika 3–6 bulan pengeluaran, bukan 1–2 minggu.</li>
                <li>Pisahkan akun (dompet terpisah) agar tidak terkuras.</li>
                <li>Sisihkan otomatis saat gajian masuk.</li>
                <li>Jangan gunakan untuk belanja sembarangan.</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
            <button
              type="button"
              onClick={handleCreateGoal}
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: '11px 26px', fontSize: 14, fontWeight: 700 }}
            >
              {saving ? 'Menyimpan target...' : 'Buat target tabungan di /tabungan'}
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
          <div className="card" style={{ padding: '20px', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Icon name="shopping_cart" size={18} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Hitung pengeluaran</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Catat pengeluaran 1 bulan terakhir, lalu kalikan dengan 3–6 untuk target dana darurat.
            </p>
          </div>
          <div className="card" style={{ padding: '20px', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--income-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <Icon name="shield" size={18} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Jaga dari krisis</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Dana darurat menjaga rencana keuangan tetap bertahan saat hal-hal tak terduga terjadi.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
