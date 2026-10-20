'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DaftarPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Kata sandi tidak sama');
      return;
    }
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Pendaftaran gagal');
      } else {
        router.push('/dasbor');
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left hero */}
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
            <div className="auth-logo-icon">A</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: 'white' }}>arus</span>
          </div>
          <h1 className="auth-hero-title">
            Kenali arus uangmu.<br />Rencanakan hidupmu.
          </h1>
          <p className="auth-hero-subtitle">
            Satu tempat untuk mencatat, mengelola, dan merencanakan keuangan pribadi dengan lebih bijak dan terencana.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📊', text: 'Pantau pemasukan & pengeluaran real-time' },
              { icon: '🎯', text: 'Buat anggaran & capai tujuan finansial' },
              { icon: '📈', text: 'Laporan keuangan visual & mudah dipahami' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-logo" style={{ marginBottom: 8 }}>
          <div className="auth-logo-icon">A</div>
          arus
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
          Sudah punya akun?{' '}
          <Link href="/masuk" style={{ color: 'var(--primary)', fontWeight: 600 }}>Masuk di sini</Link>
        </div>

        <h2 className="auth-title">Buat akun Arus</h2>
        <p className="auth-subtitle">Isi data diri Anda untuk memulai perjalanan finansial yang lebih baik.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama lengkap</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Nama Anda"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="nama@email.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kata sandi</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer', border: 'none' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Konfirmasi kata sandi</label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              placeholder="Ulangi kata sandi"
              value={form.confirmPassword}
              onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <div className="form-error">Kata sandi tidak sama</div>
            )}
          </div>
          <button
            id="register-btn"
            type="submit"
            className="auth-submit"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? 'Mendaftar...' : '→ Daftar akun'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Dengan mendaftar, Anda menyetujui{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Syarat & Ketentuan</span>
            {' '}dan{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Kebijakan Privasi</span> kami.
          </span>
        </div>
      </div>
    </div>
  );
}
