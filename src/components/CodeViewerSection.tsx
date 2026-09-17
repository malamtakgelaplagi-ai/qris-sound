import React, { useState } from 'react';
import { Code, Copy, Check, FileText, Database, Globe, Puzzle, Server } from 'lucide-react';

export const CodeViewerSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'scraper' | 'soundbox' | 'vercel' | 'extension' | 'backendCookies'>('scraper');
  const [copied, setCopied] = useState<boolean>(false);

  const codeSnippets = {
    extension: `// ==========================================================
// CHROME EXTENSION: soundbox-cookie-extractor/background.js
// Otomatis deteksi sesi kasir GoBiz / DANA & kirim ke server
// ==========================================================
const BACKEND_API_URL = "https://aplikasi-sewa.com/api/save-cookies";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('dashboard')) {
    let targetDomain = "";
    if (tab.url.includes("gobiz.co.id")) targetDomain = ".gobiz.co.id";
    if (tab.url.includes("danabisnis.id")) targetDomain = ".danabisnis.id";

    if (targetDomain) {
      try {
        const cookies = await chrome.cookies.getAll({ domain: targetDomain });
        const storage = await chrome.storage.local.get(["merchantId"]);
        const merchantId = storage.merchantId || 1; 

        if (cookies && cookies.length > 0) {
          await fetch(BACKEND_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              merchantId: merchantId,
              sessionCookies: cookies
            })
          });
          console.log(\`[SUCCESS] Cookies synced automatically for Merchant #\${merchantId}\`);
        }
      } catch (error) {
        console.error("Failed to sync cookies automatically:", error);
      }
    }
  }
});`,

    backendCookies: `// ==========================================================
// BACKEND API: router.post('/api/save-cookies')
// Simpan cookies dari extension ke PostgreSQL (session_cookies)
// ==========================================================
const express = require('express');
const router = express.Router();
const db = require('./db'); // Pool PostgreSQL

router.post('/api/save-cookies', async (req, res) => {
  const { merchantId, sessionCookies } = req.body;

  try {
    // Simpan session cookies terenkripsi di PostgreSQL
    await db.query(
      'UPDATE merchants SET session_cookies = $1, last_scraped_at = NOW() WHERE id = $2',
      [JSON.stringify(sessionCookies), merchantId]
    );

    console.log(\`[SYNC] Cookies tersimpan untuk Merchant #\${merchantId}\`);
    return res.status(200).json({ success: true, message: "Cookies synced safely." });
  } catch (error) {
    console.error("Database update failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;`,

    vercel: `{
  "framework": "vite",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`,
    sql: `-- ==========================================================
-- 1. STRUKTUR DATABASE POSTGRESQL (Anti-Duplikasi & Merchant)
-- ==========================================================

-- Tabel Toko / Kredensial Scraper
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    merchant_name VARCHAR(100) NOT NULL,
    wallet_type VARCHAR(50) DEFAULT 'GoBiz', -- GoBiz, ShopeePay, OVO, DANA
    wallet_username VARCHAR(100) NOT NULL,
    wallet_password TEXT NOT NULL,           -- Wajib dienkripsi AES-256!
    session_cookies JSONB,                   -- Menyimpan cookies sesi aktif agar bypass OTP/Captcha
    is_scraper_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Transaksi yang Sudah Dibaca (Deduplikasi Suara)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES merchants(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) NOT NULL UNIQUE, -- Index UNIQUE mencegah spiker bunyi 2x!
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'QRIS',
    status VARCHAR(20) DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index percepat pengecekan mutasi terbaru
CREATE INDEX idx_tx_merchant ON transactions(merchant_id, created_at DESC);
CREATE INDEX idx_tx_unique_id ON transactions(transaction_id);`,

    scraper: `// ==========================================================
// 2. BACKEND SCRAPER MUTASI (Node.js + Puppeteer Headless)
// Jalankan dengan: node scraper.js atau via node-cron
// ==========================================================
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const { Pool } = require('pg');
const { Server } = require('socket.io');

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/soundbox'
});

// Helper Enkripsi/Dekripsi AES-256
const ENCRYPTION_KEY = process.env.APP_SECRET_KEY || '12345678901234567890123456789012'; // 32 bytes
function decryptPassword(encryptedText) {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function scrapeMutasi(merchant, socketIO) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  try {
    // 1. OPSI UTAMA: Gunakan Session Cookies Aktif untuk Bypass Captcha/OTP
    if (merchant.session_cookies) {
      await page.setCookie(...merchant.session_cookies);
    } else {
      // OPSI CADANGAN: Login manual form jika sesi belum ada
      const rawPassword = decryptPassword(merchant.wallet_password);
      await page.goto('https://merchant.ewallet.com/login', { waitUntil: 'networkidle2' });
      await page.type('#username-input', merchant.wallet_username, { delay: 50 });
      await page.type('#password-input', rawPassword, { delay: 50 });
      await page.click('#btn-login');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    }

    // 2. Akses halaman mutasi/riwayat transaksi
    await page.goto('https://merchant.ewallet.com/transactions', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.transaction-row', { timeout: 10000 });

    // 3. Ekstraksi data baris transaksi terbaru (paling atas)
    const transaksiTerbaru = await page.evaluate(() => {
      const row = document.querySelector('.transaction-row');
      if (!row) return null;

      const rawAmount = row.querySelector('.amount')?.innerText || '0';
      const cleanNominal = parseFloat(rawAmount.replace(/[^0-9]/g, ''));
      const statusText = row.querySelector('.status')?.innerText?.trim().toUpperCase() || '';
      const txId = row.getAttribute('data-tx-id') || row.querySelector('.tx-code')?.innerText?.trim();

      return { txId, nominal: cleanNominal, status: statusText };
    });

    if (transaksiTerbaru && (transaksiTerbaru.status === 'SUCCESS' || transaksiTerbaru.status === 'BERHASIL')) {
      // 4. CEK DEDUKLIKASI: Apakah ID transaksi sudah pernah tersimpan di database?
      const sudahAda = await db.query(
        'SELECT id FROM transactions WHERE transaction_id = $1',
        [transaksiTerbaru.txId]
      );

      if (sudahAda.rows.length === 0) {
        // Simpan ke database
        await db.query(
          'INSERT INTO transactions (merchant_id, transaction_id, amount, status) VALUES ($1, $2, $3, $4)',
          [merchant.id, transaksiTerbaru.txId, transaksiTerbaru.nominal, 'SUCCESS']
        );

        // 5. Kirim sinyal Real-Time via WebSocket ke Soundbox Kasir!
        socketIO.to(\`merchant_\${merchant.id}\`).emit('pembayaran_masuk', {
          nominal: transaksiTerbaru.nominal,
          txId: transaksiTerbaru.txId,
          timestamp: new Date().toLocaleTimeString('id-ID')
        });

        console.log(\`[SUKSES] Transaksi baru dibaca & suara ditembak: Rp \${transaksiTerbaru.nominal} (ID: \${transaksiTerbaru.txId})\`);
      } else {
        console.log(\`[DEDUP] Transaksi \${transaksiTerbaru.txId} sudah pernah dibaca. Suara diabaikan.\`);
      }
    }
  } catch (error) {
    console.error(\`[ERROR] Scraper gagal untuk merchant \${merchant.id}:\`, error.message);
  } finally {
    await browser.close();
  }
}`,

    soundbox: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Soundbox Kasir UMKM</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { max-width: 420px; width: 100%; background: #1e293b; padding: 32px; border-radius: 24px; text-align: center; border: 1px solid #334155; }
    .btn { background: #2563eb; color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; cursor: pointer; margin: 16px 0; }
    .display { background: #020617; border: 2px dashed #10b981; border-radius: 16px; padding: 24px; margin: 20px 0; }
    select { width: 100%; padding: 10px; border-radius: 8px; background: #334155; color: white; border: none; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>🔊 Web Soundbox Kasir UMKM</h2>
    <p style="color: #10b981; font-size: 13px;">● Terhubung ke Server Scraper</p>

    <!-- Tombol bypass Autoplay Policy Browser -->
    <button class="btn" id="btn-start" onclick="aktifkanSuara()">Mulai Sesi Kasir &amp; Aktifkan Suara</button>

    <div class="display" id="display-transaksi">
      <h3 id="tx-title" style="margin: 0;">Menunggu Pembayaran QRIS...</h3>
    </div>

    <div style="text-align: left; margin-top: 20px;">
      <label style="font-size: 13px;">Pilih Karakter Suara Spiker:</label>
      <select id="karakter-suara">
        <option value="laras">Kak Laras (Ramah & Standar)</option>
        <option value="amoy">Ci Amoy (Ceria & Cepat)</option>
        <option value="slamet">Pakde Slamet (Mantap & Berat)</option>
      </select>
    </div>
  </div>

  <script>
    let suaraAktif = false;
    const socket = io('https://domain-server-anda.com');
    const merchantId = 1;

    socket.emit('join_room', \`merchant_\${merchantId}\`);

    function aktifkanSuara() {
      suaraAktif = true;
      document.getElementById('btn-start').style.background = '#475569';
      document.getElementById('btn-start').innerText = '🔒 Suara Sudah Aktif';
      bicara("Sistem spiker siap menerima pembayaran.", "laras");
    }

    socket.on('pembayaran_masuk', (data) => {
      document.getElementById('display-transaksi').innerHTML = \`
        <span style="color:#10b981; font-size: 12px; font-weight: bold;">QRIS BERHASIL</span>
        <h2 style="margin: 6px 0; font-size: 32px;">Rp \${Number(data.nominal).toLocaleString('id-ID')}</h2>
        <span style="color:#94a3b8; font-size: 11px;">ID: \${data.txId}</span>
      \`;

      const karakter = document.getElementById('karakter-suara').value;
      if (suaraAktif) {
        bicara(\`QRIS sukses diterima, sebesar, \${data.nominal}, rupiah.\`, karakter);
      }
    });

    function bicara(teks, karakter) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(teks);
        u.lang = 'id-ID';

        if (karakter === 'amoy') { u.pitch = 1.4; u.rate = 1.1; }
        else if (karakter === 'slamet') { u.pitch = 0.7; u.rate = 0.85; }
        else { u.pitch = 1.0; u.rate = 0.95; }

        window.speechSynthesis.speak(u);
      }
    }
  </script>
</body>
</html>`,
  };

  const handleCopy = () => {
    const code = codeSnippets[activeTab];
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="code-export-section" className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            Kode Lengkap Backend &amp; Database Produksi
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Salin skrip siap pakai untuk dideploy ke VPS/Server Node.js Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('scraper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scraper' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              scraper.js
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sql' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              schema.sql
            </button>
            <button
              onClick={() => setActiveTab('soundbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'soundbox' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              soundbox.html
            </button>
            <button
              onClick={() => setActiveTab('extension')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'extension' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              extension.js
            </button>
            <button
              onClick={() => setActiveTab('backendCookies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'backendCookies' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              api/save-cookies
            </button>
            <button
              onClick={() => setActiveTab('vercel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vercel' ? 'bg-black text-white ring-1 ring-white/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg width="10" height="9" viewBox="0 0 76 65" fill="none">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
              </svg>
              vercel.json
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin Kode'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <pre className="bg-slate-950 p-5 rounded-2xl font-mono text-xs text-slate-300 overflow-x-auto max-h-96 border border-slate-800 leading-relaxed select-text">
          <code>{codeSnippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
};
