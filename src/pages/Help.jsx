import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';

export default function Help() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(0); // first FAQ open by default
  const [copySuccess, setCopySuccess] = useState(false);

  // Form state for ticket submission
  const [ticketForm, setTicketForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    category: 'transaksi',
    subject: '',
    message: '',
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const CATEGORIES = [
    { id: 'all', label: 'Semua Topik', icon: 'apps' },
    { id: 'dompet', label: 'Dompet & Saldo', icon: 'account_balance_wallet' },
    { id: 'transaksi', label: 'Transaksi', icon: 'swap_vert' },
    { id: 'anggaran', label: 'Anggaran & Tabungan', icon: 'track_changes' },
    { id: 'akun', label: 'Akun & Keamanan', icon: 'shield' },
  ];

  const FAQS = [
    {
      id: 1,
      category: 'dompet',
      question: 'Bagaimana cara menambahkan rekening atau dompet baru?',
      answer:
        'Buka menu "Dompet" di bilah navigasi kiri, kemudian tekan tombol "+ Tambah dompet". Anda dapat memilih tipe sumber dana (Rekening Utama, E-Wallet, atau Uang Tunai) dan mengisi saldo awal sesuai nominal terkini.',
    },
    {
      id: 2,
      category: 'dompet',
      question: 'Bagaimana cara memindahkan saldo antar rekening / dompet?',
      answer:
        'Di menu "Dompet", klik tombol "Pindahkan dana". Pilih dompet asal (pengirim), dompet tujuan (penerima), dan masukkan jumlah nominal transfer. Saldo kedua rekening akan otomatis diperbarui secara aman.',
    },
    {
      id: 3,
      category: 'transaksi',
      question: 'Bagaimana cara mencatat transaksi pemasukan atau pengeluaran?',
      answer:
        'Masuk ke menu "Transaksi" lalu tekan tombol "+ Catat Transaksi". Pilih tipe (Pengeluaran atau Pemasukan), dompet yang digunakan, kategori transaksi, tanggal, dan nominal transaksi.',
    },
    {
      id: 4,
      category: 'transaksi',
      question: 'Bagaimana cara mengekspor riwayat transaksi ke file CSV / Excel?',
      answer:
        'Buka menu "Pengaturan" di navigasi kiri, lalu pilih tab "Cadangan & Data". Klik tombol "Unduh File CSV (.csv)" untuk mengunduh seluruh arsip pembukuan Anda secara instan.',
    },
    {
      id: 5,
      category: 'anggaran',
      question: 'Bagaimana cara membatasi pengeluaran per kategori (Anggaran)?',
      answer:
        'Kunjungi menu "Anggaran", lalu klik "+ Buat Anggaran". Tentukan kategori (misal: Makanan, Transportasi, Belanja) dan masukkan batas maksimal anggaran bulan ini. Sistem akan memantau dan memberi peringatan jika mendekati batas.',
    },
    {
      id: 6,
      category: 'anggaran',
      question: 'Bagaimana cara membuat target tabungan / celengan impian?',
      answer:
        'Di halaman "Tabungan" atau tombol "Target Impian" di halaman Anggaran, buat impian baru dengan mengisi nama impian, target nominal rupiah, dan target tanggal pencapaian. Anda dapat menambah setoran tabungan kapan saja.',
    },
    {
      id: 7,
      category: 'akun',
      question: 'Bagaimana cara mengaktifkan Mode Malam (Night Mode)?',
      answer:
        'Anda dapat mengklik ikon toggle Matahari/Bulan di bilah atas (topbar) di setiap halaman, menggunakan tombol "Mode Malam" di menu sidebar kiri, atau melalui menu "Pengaturan" > "Preferensi Keuangan".',
    },
    {
      id: 8,
      category: 'akun',
      question: 'Apakah data keuangan saya aman di Money Management?',
      answer:
        'Sangat aman. Setiap akun terlindungi dengan enkripsi kata sandi menggunakan algoritma hashing bcrypt dan token otentikasi JWT yang terisolasi per pengguna.',
    },
  ];

  // Filter FAQs based on active category & search query
  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@moneymanagement.id');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitting(true);
    setTimeout(() => {
      setTicketSubmitting(false);
      setTicketSubmitted(true);
      setTicketForm({
        name: user?.name || '',
        email: user?.email || '',
        category: 'transaksi',
        subject: '',
        message: '',
      });
      setTimeout(() => setTicketSubmitted(false), 5000);
    }, 700);
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Ruang personal
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&gt;</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Pusat Bantuan
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Bantuan Aktif 24/7
          </div>

          <NotificationButton />

          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            30 September 2026
          </span>
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: 60 }}>
        {/* Signature Navy Hero Banner */}
        <div
          className="navy-banner"
          style={{
            borderRadius: 18,
            padding: '28px 32px',
            marginBottom: 24,
            alignItems: 'center',
            position: 'relative',
            zIndex: 30,
          }}
        >
          <div className="navy-banner-left" style={{ flex: 1, position: 'relative', zIndex: 40 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                color: '#E0EDFD',
                fontSize: 11.5,
                fontWeight: 700,
                marginBottom: 10,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Icon name="support_agent" size={15} /> Layanan &amp; Panduan Pengguna
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: 6,
                letterSpacing: '-0.4px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Ada yang bisa kami bantu?
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', maxWidth: 540, lineHeight: 1.5 }}>
              Pelajari panduan fitur pembukuan, temukan solusi masalah yang sering dialami, atau hubungi tim bantuan Money Management.
            </p>

            {/* Search Input inside banner */}
            <div style={{ marginTop: 18, position: 'relative', maxWidth: 480 }}>
              <Icon
                name="search"
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Cari topik bantuan (misal: tambah dompet, anggaran, CSV)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 16px 11px 40px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="navy-banner-right" style={{ display: 'none' }} />
        </div>

        {/* 4 Feature Topic Quick Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div
            className="card"
            onClick={() => { setActiveCategory('dompet'); setSearchQuery(''); }}
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              cursor: 'pointer',
              border: activeCategory === 'dompet' ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--primary-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icon name="account_balance_wallet" size={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Dompet &amp; Saldo
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Panduan rekening bank, e-wallet, uang fisik, dan mutasi saldo.
            </div>
          </div>

          <div
            className="card"
            onClick={() => { setActiveCategory('transaksi'); setSearchQuery(''); }}
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              cursor: 'pointer',
              border: activeCategory === 'transaksi' ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--primary-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icon name="swap_vert" size={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Catatan Transaksi
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Pencatatan pemasukan, pengeluaran, kategori, dan ekspor data.
            </div>
          </div>

          <div
            className="card"
            onClick={() => { setActiveCategory('anggaran'); setSearchQuery(''); }}
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              cursor: 'pointer',
              border: activeCategory === 'anggaran' ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--primary-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icon name="track_changes" size={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Anggaran &amp; Impian
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Atur batas belanja bulanan dan target celengan tabungan.
            </div>
          </div>

          <div
            className="card"
            onClick={() => { setActiveCategory('akun'); setSearchQuery(''); }}
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              cursor: 'pointer',
              border: activeCategory === 'akun' ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--primary-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icon name="shield" size={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Akun &amp; Keamanan
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Ganti kata sandi, preferensi siklus gajian, dan tema visual.
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout: Left FAQ Accordion (60%), Right Contact Channels & Quick Ticket (40%) */}
        <div className="help-layout-grid" style={{ gap: 24, alignItems: 'start' }}>
          {/* LEFT: FAQ ACCORDION */}
          <div>
            <div className="card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Tanya Jawab Populer (FAQ)
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Jawaban cepat untuk pertanyaan yang sering diajukan
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'var(--primary-50)',
                    color: 'var(--primary)',
                  }}
                >
                  {filteredFaqs.length} Pertanyaan
                </span>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '6px 13px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: activeCategory === cat.id ? 'var(--primary)' : 'var(--border)',
                      background: activeCategory === cat.id ? 'var(--primary)' : 'var(--bg-card)',
                      color: activeCategory === cat.id ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* FAQ Accordion List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredFaqs.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Icon name="search_off" size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Tidak menemukan topik yang dicari
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Coba gunakan kata kunci lain atau kirim pesan bantuan ke tim kami.
                    </div>
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const isOpen = expandedFaq === faq.id;
                    return (
                      <div
                        key={faq.id}
                        style={{
                          borderRadius: 12,
                          border: '1px solid',
                          borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
                          background: isOpen ? 'var(--primary-50)' : 'var(--bg-card2)',
                          overflow: 'hidden',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <div
                          onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                          style={{
                            padding: '13px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: isOpen ? 'var(--primary)' : 'var(--border)',
                                color: isOpen ? '#FFFFFF' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </span>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {faq.question}
                            </span>
                          </div>
                          <Icon
                            name={isOpen ? 'expand_less' : 'expand_more'}
                            size={18}
                            style={{ color: isOpen ? 'var(--primary)' : 'var(--text-muted)' }}
                          />
                        </div>

                        {isOpen && (
                          <div
                            style={{
                              padding: '0 16px 14px 48px',
                              fontSize: 12.5,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.6,
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                            }}
                          >
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: CONTACT CHANNELS & QUICK TICKET */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Direct Support Channels Box */}
            <div className="card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
                Saluran Bantuan Langsung
              </h3>

              {/* Email Support Item */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="mail" size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email Dukungan</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      support@moneymanagement.id
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: 11.5, padding: '5px 10px' }}
                >
                  {copySuccess ? '✓ Tersalin' : 'Salin'}
                </button>
              </div>

              {/* Live Chat / WhatsApp Item */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: '#10B981',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="chat" size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Layanan WhatsApp</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      +62 812-9876-5432
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                  }}
                >
                  08.00 - 20.00 WIB
                </span>
              </div>

              {/* Operating Hours Info */}
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Icon name="schedule" size={14} />
                <span>Waktu respons rata-rata tim bantuan: kurang dari 15 menit.</span>
              </div>
            </div>

            {/* Quick Ticket Form Box */}
            <div className="card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                Kirim Pertanyaan / Masukan
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Ada kendala atau fitur yang ingin diusulkan? Tuliskan kepada tim kami.
              </p>

              {ticketSubmitted && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <Icon name="check_circle" size={18} />
                  <span>Pesan Anda berhasil terkirim! Tim kami akan merespons melalui email.</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Kategori Pertanyaan</label>
                  <select
                    className="form-select"
                    style={{ fontSize: 12.5, padding: '7px 10px' }}
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  >
                    <option value="transaksi">Pencatatan Transaksi</option>
                    <option value="dompet">Rekening &amp; Saldo Dompet</option>
                    <option value="anggaran">Anggaran &amp; Target Tabungan</option>
                    <option value="bug">Laporkan Bug / Kendala Sistem</option>
                    <option value="saran">Saran Fitur Baru</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Subjek Singkat</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Saldo dompet tidak bertambah"
                    className="form-input"
                    style={{ fontSize: 12.5, padding: '7px 10px' }}
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Detail Pertanyaan / Kendala</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Jelaskan kendala Anda sedetail mungkin agar dapat kami bantu segera..."
                    className="form-input"
                    style={{ fontSize: 12.5, padding: '8px 10px', resize: 'vertical' }}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '9px 16px', fontSize: 13 }}
                >
                  <Icon name="send" size={15} />
                  {ticketSubmitting ? 'Mengirim...' : 'Kirim Pesan Bantuan'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
