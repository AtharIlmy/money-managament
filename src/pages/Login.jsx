import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getApiUrl, parseApiResponse } from '../context/AuthContext';
import Logo from '../components/Logo';
import Icon from '../components/Icon';

export default function Login({ defaultShowForgot = false }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(defaultShowForgot);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUserName, setForgotUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoginSuccessMsg('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dasbor');
    } catch (err) {
      const msg = err.message === 'Failed to fetch'
        ? 'Tidak dapat terhubung ke server backend. Pastikan server backend sedang berjalan.'
        : (err.message || 'Email atau kata sandi tidak sesuai');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      return setForgotError('Email wajib diisi');
    }

    setForgotLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await parseApiResponse(res, 'Gagal memverifikasi email');
      if (res.ok) {
        setForgotUserName(data.name || '');
        setForgotStep(2);
      } else {
        setForgotError(data.error || 'Email tidak ditemukan dalam sistem');
      }
    } catch (err) {
      setForgotError(err.message === 'Failed to fetch' ? 'Tidak dapat terhubung ke server backend.' : (err.message || 'Gagal memverifikasi email'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!newPassword || !confirmPassword) {
      return setForgotError('Silakan isi kata sandi baru dan konfirmasi');
    }
    if (newPassword.length < 6) {
      return setForgotError('Kata sandi baru minimal 6 karakter');
    }
    if (newPassword !== confirmPassword) {
      return setForgotError('Konfirmasi kata sandi tidak cocok');
    }

    setForgotLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword,
        }),
      });
      const data = await parseApiResponse(res, 'Gagal mereset kata sandi');
      if (res.ok) {
        setForgotStep(3);
      } else {
        setForgotError(data.error || 'Gagal mereset kata sandi');
      }
    } catch (err) {
      setForgotError(err.message === 'Failed to fetch' ? 'Tidak dapat terhubung ke server backend.' : (err.message || 'Terjadi kesalahan pada server'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinishReset = () => {
    setShowForgotModal(false);
    setForm((p) => ({ ...p, email: forgotEmail, password: '' }));
    setLoginSuccessMsg('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.');
    setForgotStep(1);
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand & Header */}
        <div className="auth-card-header">
          <div className="auth-card-logo">
            <Logo size={46} rx={18} style={{ boxShadow: '0 4px 16px rgba(11,23,40,0.18)', borderRadius: 14 }} />
          </div>
          <div className="auth-brand-name">Money Management</div>
          <h1 className="auth-title">Selamat Datang Kembali</h1>
          <p className="auth-subtitle">Masuk untuk mengelola keuangan pribadimu</p>
        </div>

        {/* Tab Switcher (Masuk / Daftar) */}
        <div className="auth-tabs">
          <Link to="/masuk" className="auth-tab-btn active">
            <Icon name="login" size={16} />
            <span>Masuk</span>
          </Link>
          <Link to="/daftar" className="auth-tab-btn">
            <Icon name="person_add" size={16} />
            <span>Daftar Akun</span>
          </Link>
        </div>

        {loginSuccessMsg && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <Icon name="check" size={16} style={{ marginRight: 6 }} /> {loginSuccessMsg}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="warning" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="lock" size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Kata sandi</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan kata sandi"
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              Ingat saya
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(form.email || '');
                setForgotStep(1);
                setForgotError('');
                setShowForgotModal(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--accent)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Lupa kata sandi?
            </button>
          </div>

          <button
            id="login-btn"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              'Memproses...'
            ) : (
              <>
                <Icon name="login" size={17} /> Masuk ke Akun
              </>
            )}
          </button>
        </form>

        {/* Security Trust Badge */}
        <div className="auth-footer-badge">
          <Icon name="lock" size={14} style={{ color: '#059669' }} />
          <span>Keamanan Data Terenkripsi & Terlindungi</span>
        </div>
      </div>

      {/* Modal Lupa Kata Sandi */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--primary)' }}>
                  lock_reset
                </span>
                <span className="modal-title" style={{ fontSize: 16 }}>Lupa Kata Sandi</span>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>
                ⚠ {forgotError}
              </div>
            )}

            {/* STEP 1: Masukkan Email Terdaftar */}
            {forgotStep === 1 && (
              <form onSubmit={handleVerifyEmail}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
                  Masukkan email akun terdaftar Anda. Kami akan memverifikasi akun Anda untuk melanjutkan proses reset kata sandi.
                </p>

                <div className="form-group">
                  <label className="form-label">Email Terdaftar</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="nama@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Memeriksa...' : 'Lanjutkan'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Atur Kata Sandi Baru */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <div
                  style={{
                    background: 'var(--primary-50)',
                    border: '1px solid var(--primary-100)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    fontSize: 12.5,
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--primary)' }}>
                    verified_user
                  </span>
                  <div>
                    Akun terverifikasi: <strong>{forgotUserName}</strong> ({forgotEmail})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Kata Sandi Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: 15,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      tabIndex={-1}
                    >
                      {showNewPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Konfirmasi Kata Sandi Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Ketik ulang kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: 15,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      tabIndex={-1}
                    >
                      {showConfirmPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                    }}
                    disabled={forgotLoading}
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Sukses */}
            {forgotStep === 3 && (
              <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 32 }}>check_circle</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Kata Sandi Berhasil Direset!
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                  Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFinishReset}
                  style={{ width: '100%', justifyContent: 'center', padding: '11px 0' }}
                >
                  Masuk ke Akun Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
