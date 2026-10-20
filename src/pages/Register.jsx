import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import Icon from '../components/Icon';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    // Validate phone if provided
    if (form.phone.trim()) {
      const cleaned = form.phone.replace(/[^0-9]/g, '');
      if (cleaned.length < 9 || cleaned.length > 15) {
        setError('Nomor HP tidak valid. Contoh: 081234567890');
        return;
      }
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone.trim());
      navigate('/dasbor');
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Brand & Header */}
        <div className="auth-card-header">
          <div className="auth-card-logo">
            <Logo size={46} rx={18} style={{ boxShadow: '0 4px 16px rgba(11,23,40,0.18)', borderRadius: 14 }} />
          </div>
          <div className="auth-brand-name">Money Management</div>
          <h1 className="auth-title">Buat Akun Baru</h1>
          <p className="auth-subtitle">Mulai kelola finansial pribadimu secara gratis</p>
        </div>

        {/* Tab Switcher (Masuk / Daftar) */}
        <div className="auth-tabs">
          <Link to="/masuk" className="auth-tab-btn">
            <Icon name="login" size={16} />
            <span>Masuk</span>
          </Link>
          <Link to="/daftar" className="auth-tab-btn active">
            <Icon name="person_add" size={16} />
            <span>Daftar Akun</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="warning" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="person" size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Nama Lengkap</span>
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Contoh: Nadia Safira"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="mail" size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Email</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="nama@email.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>

          {/* Nomor HP — untuk reminder WA */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="smartphone" size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Nomor HP WhatsApp</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: '#DCFCE7',
                  color: '#16A34A',
                  padding: '1px 7px',
                  borderRadius: 999,
                  marginLeft: 4,
                }}
              >
                Untuk reminder WA
              </span>
            </label>
            <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  background: 'var(--bg-card2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                🇮🇩 +62
              </div>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="81234567890 (tanpa 0 di depan)"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="notifications_active" size={12} style={{ color: '#16A34A' }} />
              <span>Opsional — nomor WhatsApp untuk pengingat harian (bisa diverifikasi OTP di Pengaturan)</span>
            </div>
          </div>

          {/* Kata Sandi */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="lock" size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Kata Sandi</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                tabIndex={-1}
                aria-label="Tampilkan atau sembunyikan kata sandi"
              >
                <Icon name={showPass ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </div>

          {/* Konfirmasi Kata Sandi */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="lock" size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Konfirmasi Kata Sandi</span>
            </label>
            <input
              id="confirmPassword"
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="Ulangi kata sandi"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
          </div>

          <div style={{ marginBottom: 20, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                required
                style={{ accentColor: 'var(--primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span>Saya menyetujui syarat &amp; ketentuan Money Management</span>
            </label>
          </div>

          <button
            id="register-btn"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              'Mendaftarkan...'
            ) : (
              <>
                <Icon name="person_add" size={17} /> Buat Akun Sekarang
              </>
            )}
          </button>
        </form>

        {/* Security Trust Badge */}
        <div className="auth-footer-badge">
          <Icon name="lock" size={14} style={{ color: '#059669' }} />
          <span>Keamanan Data Terenkripsi &amp; Terlindungi</span>
        </div>
      </div>
    </div>
  );
}
