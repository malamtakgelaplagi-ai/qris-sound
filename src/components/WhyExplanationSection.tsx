import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Volume2, Database, Key, Server, Cpu, CheckCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  icon: React.ReactNode;
  badge: string;
  shortAnswer: string;
  detailedPoints: string[];
}

export const WhyExplanationSection: React.FC = () => {
  const [openId, setOpenId] = useState<string>('why-scraper');

  const faqs: FaqItem[] = [
    {
      id: 'why-scraper',
      question: '1. Mengapa Memakai Scraper Puppeteer dibanding API Resmi Bank/E-Wallet?',
      icon: <Cpu className="w-5 h-5 text-blue-600" />,
      badge: 'Solusi Gratis UMKM',
      shortAnswer: 'Karena API resmi perbankan mensyaratkan izin badan hukum (PT/CV) dan biaya setup yang memberatkan pedagang kecil.',
      detailedPoints: [
        'Syarat Legalitas Ketat: API resmi perbankan (seperti BCA SNAP, Mandiri Open API, GoPay Enterprise) mewajibkan dokumen legalitas badan hukum seperti Akta PT/CV, NIB, NPWP Badan, serta rekening koran.',
        'Biaya Setup & Langganan Mahal: Penyedia Payment Gateway resmi seringkali mengenakan biaya integrasi awal jutaan rupiah serta potongan komisi (MDR) tambahan yang menekan margin usaha UMKM.',
        'Aksesibilitas Cepat: Dengan Headless Scraper (Puppeteer), pedagang mikro atau pemilik warung yang hanya memiliki akun merchant personal/web portal e-wallet dapat langsung mengotomatisasi baca mutasi secara 100% gratis.',
      ],
    },
    {
      id: 'why-sound-button',
      question: '2. Mengapa Butuh Tombol "Mulai Sesi Kasir & Aktifkan Suara"?',
      icon: <Volume2 className="w-5 h-5 text-emerald-600" />,
      badge: 'Autoplay Policy Browser',
      shortAnswer: 'Browser modern secara ketat memblokir audio atau suara otomatis sebelum pengguna melakukan klik pertama (User Gesture).',
      detailedPoints: [
        'Kebijakan Browser Chrome/Safari: Fitur Web Audio API dan SpeechSynthesis diblokir jika dijalankan tanpa interaksi manusia guna mencegah situs web memutar iklan bising yang mengganggu.',
        'Membuka Kunci (Unlock) Audio Context: Saat kasir mengklik tombol "Mulai Sesi Kasir", browser mencatat bahwa pengguna telah memberikan izin audio, sehingga ketika ada sinyal WebSocket transaksi masuk di latar belakang, suara dapat langsung berkumandang.',
        'Reliabilitas Suara di Kasir: Menghindari kasus kasir tidak mendengar notifikasi karena browser membungkam suara di tab background.',
      ],
    },
    {
      id: 'why-deduplication',
      question: '3. Mengapa Tabel Database Wajib Kolom `transaction_id UNIQUE`?',
      icon: <Database className="w-5 h-5 text-amber-600" />,
      badge: 'Anti-Duplikasi Suara',
      shortAnswer: 'Mencegah spiker berbunyi berulang-ulang untuk 1 transaksi yang sama saat scraper memeriksa mutasi berkala.',
      detailedPoints: [
        'Mekanisme Cron Scraper: Robot scraper berjalan memeriksa halaman web e-wallet setiap 10–30 detik sekali. Transaksi terakhir akan selalu terlihat di baris paling atas selama belum ada transaksi baru.',
        'Pengecekan SELECT WHERE: Sebelum membunyikan suara, backend mengecek `SELECT * FROM transactions WHERE transaction_id = $1`. Jika sudah pernah ada, proses berhenti dan TIDAK mengirim sinyal audio.',
        'Integritas Laporan Keuangan: Mencegah pencatatan dobel pada pembukuan omzet harian UMKM.',
      ],
    },
    {
      id: 'why-aes256',
      question: '4. Mengapa Password Toko Wajib Dienkripsi AES-256?',
      icon: <Key className="w-5 h-5 text-purple-600" />,
      badge: 'Keamanan Kredensial',
      shortAnswer: 'Menghindari kebocoran akun dompet digital / rekening bank toko jika database mengalami kebocoran data.',
      detailedPoints: [
        'Standar PCI-DSS & OWASP: Kredensial keuangan tidak boleh disimpan dalam format teks biasa (plain text).',
        'Enkripsi Dua Arah Simetris: Scraper tetap membutuhkan password asli untuk mengetik ke form login, sehingga algoritma AES-256 dengan secret key yang aman di file environment server adalah metode yang tepat.',
        'Pemisahan Kunci Enkripsi: Secret key disimpan terpisah dari database (di dalam environment variable container yang terkunci).',
      ],
    },
    {
      id: 'why-session-cookies',
      question: '5. Mengapa Dianjurkan Menggunakan Session Cookies Aktif?',
      icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
      badge: 'Bypass Captcha & OTP',
      shortAnswer: 'Menghindari blokir sistem keamanan perbankan (Cloudflare, OTP SMS, Captcha) akibat login berulang tiap menit.',
      detailedPoints: [
        'Deteksi Bot Login: Server e-wallet/bank akan mencurigai robot jika mendeteksi login baru dari IP server setiap 60 detik dan akan memunculkan verifikasi OTP atau tebak gambar Captcha.',
        'Metode Session Injection: Pemilik toko login manual sekali di browser fisik (menyelesaikan OTP/Captcha), lalu cookie sesi yang valid diekspor ke Puppeteer (`await page.setCookie(...)`).',
        'Langsung Buka Halaman Transaksi: Scraper langsung mengakses URL mutasi tanpa perlu melewati form login, berjalan lebih cepat (<2 detik) dan hemat sumber daya CPU server.',
      ],
    },
    {
      id: 'why-websocket',
      question: '6. Mengapa Menggunakan WebSocket (Socket.io) Dibandingkan HTTP Polling?',
      icon: <Server className="w-5 h-5 text-rose-600" />,
      badge: 'Latensi Real-Time < 300ms',
      shortAnswer: 'Memberikan pengumuman suara instan saat pembeli menunggu di depan meja kasir tanpa jeda waktu.',
      detailedPoints: [
        'Pengalaman Pembayaran Nyata: Pelanggan yang baru saja memindai QRIS ingin segera mendengar "QRIS sukses diterima" sebagai bukti sah sebelum meninggalkan gerai.',
        'Efisiensi Jaringan: WebSocket menjaga koneksi dua arah tetap terbuka ringan, daripada kasir harus terus me-request API (HTTP Polling) yang membebani kuota data dan server.',
      ],
    },
  ];

  return (
    <div id="why-architecture-section" className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-blue-100/80 shadow-sm">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold mb-3 shadow-sm">
          <HelpCircle className="w-3.5 h-3.5" />
          Panduan Lengkap Arsitektur
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Mengapa Sistem Ini Dirancang Seperti Ini?
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Berikut adalah penjelasan mendalam mengenai keputusan teknis di balik penggunaan Scraper Puppeteer, Web Soundbox browser kasir, mitigasi duplikasi mutasi, dan keamanan kredensial.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100'
                  : 'bg-white/80 border-slate-200/80 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? '' : faq.id)}
                className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">{faq.icon}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{faq.question}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {faq.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{faq.shortAnswer}</p>
                  </div>
                </div>
                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-700 shrink-0 mt-1">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                  <div className="space-y-2 mt-3 pl-2 sm:pl-10">
                    {faq.detailedPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
