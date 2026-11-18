import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

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
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agree) {
      setError('Silakan setujui syarat & ketentuan terlebih dahulu');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    // Format phone with +62 prefix if provided
    let formattedPhone = form.phone.trim();
    if (formattedPhone) {
      const cleanPhone = formattedPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '62' + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith('62')) {
        formattedPhone = '62' + cleanPhone;
      } else {
        formattedPhone = cleanPhone;
      }
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, formattedPhone);
      navigate('/dasbor');
    } catch (err) {
      const msg =
        err.message === 'Failed to fetch'
          ? 'Tidak dapat terhubung ke server backend.'
          : err.message || 'Pendaftaran gagal';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullscreen-page">
      {/* Fullscreen Side-by-Side Layout matching Figma */}
      <div className="auth-fullscreen-layout">
        {/* LEFT CARD: Dark Navy Feature Showcase */}
        <div className="auth-showcase-card">
          {/* Subtle soft circular ambient glow in background */}
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

          {/* Top Logo */}
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
              {/* Feature 01: DOMPET */}
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

              {/* Feature 02 & 03: ANGGARAN & TABUNGAN */}
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

        {/* RIGHT PANEL: Pure White Surface with Centered Register Form — compact for no-scroll */}
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
              Buat Akun Baru
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Mulai kelola finansial pribadimu secara gratis
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '460px' }}>

            {/* Headline — desktop only */}
            <div className="auth-desktop-headline">
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.5px',
                  margin: '0 0 2px',
                }}
              >
                Buat Akun Baru
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 14px' }}>
                Mulai kelola finansial pribadimu secara gratis
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
                marginBottom: 16,
                gap: 4,
              }}
            >
              <Link
                to="/masuk"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  borderRadius: 9,
                  textDecoration: 'none',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <LogIn size={14} />
                <span>Masuk</span>
              </Link>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#141A2D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={14} />
                <span>Daftar Akun</span>
              </button>
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 12.5, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {/* Nama Lengkap */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
                  <User size={13} style={{ color: '#64748B' }} />
                  <span>Nama Lengkap</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Nadia Safira"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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

              {/* Email */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
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

              {/* Nomor HP WhatsApp */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                    <Phone size={13} style={{ color: '#64748B' }} />
                    <span>Nomor HP WhatsApp</span>
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>
                    Untuk verifikasi WA
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#475569',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ID +62
                  </div>
                  <input
                    type="text"
                    placeholder="81234567890 (tanpa 0 di depan)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{
                      flex: 1,
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
                  />
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>
                  Opsional — nomor WhatsApp untuk pengingat transaksi dan fitur terkait keuanganmu.
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
                  <Lock size={13} style={{ color: '#64748B' }} />
                  <span>Kata Sandi</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
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
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
                  <Lock size={13} style={{ color: '#64748B' }} />
                  <span>Konfirmasi Kata Sandi</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checkbox Syarat & Ketentuan */}
              <div style={{ marginTop: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    style={{ accentColor: '#141A2D' }}
                  />
                  <span>Saya menyetujui syarat &amp; ketentuan Money Management.</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
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
                  marginTop: 6,
                  boxShadow: '0 4px 14px rgba(20, 26, 45, 0.2)',
                  transition: 'all 0.15s ease',
                }}
              >
                <UserPlus size={15} />
                <span>{loading ? 'Memproses...' : 'Buat Akun Sekarang'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
