import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  HelpCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, getApiUrl, parseApiResponse } from '../context/AuthContext';
import Logo from '../components/Logo';

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
      const msg =
        err.message === 'Failed to fetch'
          ? 'Tidak dapat terhubung ke server backend.'
          : err.message || 'Email atau kata sandi tidak sesuai';
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
      setForgotError(
        err.message === 'Failed to fetch'
          ? 'Tidak dapat terhubung ke server backend.'
          : err.message || 'Gagal memverifikasi email'
      );
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
      setForgotError(
        err.message === 'Failed to fetch'
          ? 'Tidak dapat terhubung ke server backend.'
          : err.message || 'Terjadi kesalahan pada server'
      );
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
    <div className="auth-fullscreen-page">
      {/* Fullscreen Side-by-Side Layout matching Masuk / Desktop */}
      <div className="auth-fullscreen-layout">
        {/* LEFT CARD: Dark Navy Feature Showcase */}
        <div className="auth-showcase-card">
          {/* Subtle soft circular ambient glow in background matching Figma */}
          <div
            style={{
              position: 'absolute',
              right: '-12%',
              top: '22%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(58, 80, 150, 0.45) 0%, rgba(20, 26, 48, 0.12) 55%, transparent 75%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top: Logo & Brand */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Logo size={36} rx={50} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Money Management
              </span>
            </div>
          </div>

          {/* Middle: Headlines & 3 Feature Cards */}
          <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', padding: '28px 0' }}>
            {/* Category Tag */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#7C8BA1',
                letterSpacing: '0.9px',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              RUANG FINANSIAL PRIBADIMU
            </div>

            {/* Big Headline */}
            <h1
              style={{
                fontSize: 'clamp(28px, 2.6vw, 36px)',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.6px',
                lineHeight: 1.15,
                margin: '0 0 12px',
              }}
            >
              Keuangan rapi.<br />Pikiran tenang.
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 13.5,
                color: '#94A3B8',
                lineHeight: 1.5,
                margin: '0 0 28px',
                maxWidth: '420px',
              }}
            >
              Satu tempat untuk dompet, anggaran, dan tujuan tabunganmu.
            </p>

            {/* 3 Feature Cards Showcase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '460px' }}>
              {/* Feature 01: DOMPET (Full Width Lavender Card) */}
              <div
                style={{
                  background: '#EEF2F6',
                  borderRadius: 18,
                  padding: '16px 20px',
                  color: '#0F172A',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.6px' }}>
                  01 / DOMPET
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', marginTop: 3 }}>
                  Semua uangmu, satu tempat.
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Rekening dan e-wallet lebih tertata.
                </div>
              </div>

              {/* Feature 02 & 03: ANGGARAN & TABUNGAN (2 Columns Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* 02 / ANGGARAN */}
                <div
                  style={{
                    background: '#1C243E',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 18,
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7C8BA1', letterSpacing: '0.6px' }}>
                    02 / ANGGARAN
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginTop: 3 }}>
                    Anggaran
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8A9BB3', marginTop: 2 }}>
                    Rencanakan pengeluaran.
                  </div>
                </div>

                {/* 03 / TABUNGAN */}
                <div
                  style={{
                    background: '#1C243E',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 18,
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7C8BA1', letterSpacing: '0.6px' }}>
                    03 / TABUNGAN
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginTop: 3 }}>
                    Tabungan
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8A9BB3', marginTop: 2 }}>
                    Wujudkan tujuanmu.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Caption */}
          <div style={{ fontSize: 11.5, color: '#64748B', position: 'relative', zIndex: 1 }}>
            Atur hari ini. Siapkan esok hari.
          </div>
        </div>

        {/* RIGHT PANEL: Pure White Surface with Centered Form */}
        <div className="auth-form-panel">
          {/* Mobile/Tablet Brand Header (shown when showcase card is hidden) */}
          <div className="auth-mobile-header">
            {/* Brand icon & text stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginBottom: 10 }}>
              <Logo size={32} rx={50} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.1px' }}>
                Money Management
              </span>
            </div>
            {/* Title & subtitle shown in the navy header on tablet/mobile */}
            <h2 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', margin: '0 0 3px' }}>
              Selamat Datang Kembali
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Masuk untuk mengelola keuangan pribadimu
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '440px' }}>

            {/* Headline — desktop only (hidden on tablet/mobile since it's in the banner) */}
            <div className="auth-desktop-headline">
              <h2
                style={{
                  fontSize: 'clamp(22px, 2vw, 26px)',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.5px',
                  margin: '0 0 4px',
                }}
              >
                Selamat Datang Kembali
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 18px' }}>
                Masuk untuk mengelola keuangan pribadimu
              </p>
            </div>

            {/* Pill Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: '#F0F3F8',
                borderRadius: 12,
                padding: 4,
                marginBottom: 18,
                gap: 4,
              }}
            >
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#141A2D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <LogIn size={15} />
                <span>Masuk</span>
              </button>
              <Link
                to="/daftar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 9,
                  textDecoration: 'none',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <UserPlus size={15} />
                <span>Daftar Akun</span>
              </Link>
            </div>

            {loginSuccessMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ECFDF5', color: '#059669', fontSize: 13, marginBottom: 14 }}>
                {loginSuccessMsg}
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Email Field */}
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
                  <Mail size={13} style={{ color: '#64748B' }} />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                    outline: 'none',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#141A2D')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                  required
                />
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
                  <Lock size={13} style={{ color: '#64748B' }} />
                  <span>Kata sandi</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      fontSize: 13,
                      outline: 'none',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#141A2D')}
                    onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                    required
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
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  marginBottom: 18,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#141A2D' }}
                  />
                  <span>Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 10,
                  background: '#141A2D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13.5,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(20, 26, 45, 0.2)',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogIn size={15} />
                <span>{loading ? 'Memproses...' : 'Masuk ke Akun'}</span>
              </button>
            </form>

            {/* Security Footer Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 16,
                color: '#94A3B8',
                fontSize: 11,
              }}
            >
              <ShieldCheck size={14} color="#10B981" />
              <span>Keamanan Data Terenkripsi & Terlindungi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lupa Kata Sandi Modal (Matching Lupa Kata Sandi / Desktop) */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 440,
              width: '100%',
              padding: '28px 26px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={18} color="#0F172A" />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Lupa Kata Sandi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
              >
                <X size={18} />
              </button>
            </div>

            {forgotStep === 1 && (
              <>
                <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 18px' }}>
                  Masukkan email akun terdaftar Anda. Kami akan memverifikasi akun Anda untuk melanjutkan proses reset kata sandi.
                </p>

                {forgotError && (
                  <div style={{ padding: '9px 12px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 12.5, marginBottom: 14 }}>
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Email Terdaftar
                    </label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: '1px solid #D1D5DB',
                        fontSize: 13.5,
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="mm-btn-white"
                      onClick={() => setShowForgotModal(false)}
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="mm-btn-navy"
                      disabled={forgotLoading}
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      {forgotLoading ? 'Memeriksa...' : 'Lanjutkan'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
                  Akun ditemukan: <strong>{forgotUserName}</strong> ({forgotEmail}). Silakan buat kata sandi baru.
                </p>

                {forgotError && (
                  <div style={{ padding: '9px 12px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 12.5, marginBottom: 14 }}>
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Kata Sandi Baru
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 13 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Ulangi kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 13 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="mm-btn-white"
                      onClick={() => setForgotStep(1)}
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="mm-btn-navy"
                      disabled={forgotLoading}
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      {forgotLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {forgotStep === 3 && (
              <div style={{ textAlign: 'center', padding: '14px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <ShieldCheck size={24} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  Kata Sandi Berhasil Diperbarui
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 18px' }}>
                  Sekarang Anda dapat masuk dengan kata sandi baru Anda.
                </p>
                <button
                  type="button"
                  className="mm-btn-navy"
                  onClick={handleFinishReset}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Masuk Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
