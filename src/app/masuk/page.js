'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MasukPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login gagal');
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
      {/* Left hero panel */}
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

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-logo" style={{ marginBottom: 8 }}>
          <div className="auth-logo-icon">A</div>
          arus
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
          Belum punya akun?{' '}
          <Link href="/daftar" style={{ color: 'var(--primary)', fontWeight: 600 }}>Daftar sekarang</Link>
        </div>

        <h2 className="auth-title">Masuk ke Arus</h2>
        <p className="auth-subtitle">Selamat datang kembali! Masukkan data akun Anda.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="email"
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
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Masukkan kata sandi"
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
          <button
            id="login-btn"
            type="submit"
            className="auth-submit"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Masuk...' : '→ Masuk'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 24 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Dengan masuk, Anda menyetujui{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Syarat & Ketentuan</span>
            {' '}dan{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Kebijakan Privasi</span> kami.
          </span>
        </div>
      </div>
    </div>
  );
}
