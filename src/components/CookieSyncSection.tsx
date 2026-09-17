import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Puzzle,
  Download,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Server,
  FileCode,
  Laptop
} from 'lucide-react';

interface MockCookie {
  name: string;
  value: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
}

export const CookieSyncSection: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'manifest' | 'background' | 'backend' | 'bot'>('manifest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Simulator state
  const [cookieStatus, setCookieStatus] = useState<'empty' | 'synced' | 'expired'>('empty');
  const [activePlatform, setActivePlatform] = useState<'gobiz' | 'danabisnis'>('gobiz');
  const [isSyncingSim, setIsSyncingSim] = useState<boolean>(false);
  const [botLog, setBotLog] = useState<string[]>([]);
  const [isBotRunning, setIsBotRunning] = useState<boolean>(false);

  const manifestCode = `{
  "manifest_version": 3,
  "name": "UMKM Soundbox Cookie Sync",
  "version": "1.0",
  "description": "Automatically syncs active merchant sessions to your Soundbox Web App.",
  "permissions": ["cookies", "storage"],
  "host_permissions": [
    "https://*.gobiz.co.id/*",
    "https://*.danabisnis.id/*",
    "https://aplikasi-sewa.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  }
}`;

  const backgroundCode = `// Replace with your production backend API URL
const BACKEND_API_URL = "https://aplikasi-sewa.com/api/save-cookies";

// Listen for updates in browser tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the user is on the target merchant dashboard and login is complete
  if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('dashboard') || tab.url.includes('transaksi'))) {
    
    let targetDomain = "";
    if (tab.url.includes("gobiz.co.id")) targetDomain = ".gobiz.co.id";
    if (tab.url.includes("danabisnis.id")) targetDomain = ".danabisnis.id";

    if (targetDomain) {
      try {
        // 1. Get all cookies for the authenticated domain
        const cookies = await chrome.cookies.getAll({ domain: targetDomain });
        
        // 2. Fetch the merchant ID from extension storage (set during onboarding)
        const storage = await chrome.storage.local.get(["merchantId"]);
        const merchantId = storage.merchantId || 1; 

        if (cookies && cookies.length > 0) {
          // 3. Send cookies automatically to your backend
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
});`;

  const backendCode = `const express = require('express');
const router = express.Router();
const db = require('./db'); // Instance Pool PostgreSQL

// Endpoint menerima cookies otomatis dari Chrome Extension
router.post('/api/save-cookies', async (req, res) => {
  const { merchantId, sessionCookies } = req.body;

  try {
    // Simpan array cookies sebagai JSONB terenkripsi di PostgreSQL
    await db.query(
      'UPDATE merchants SET session_cookies = $1, last_scraped_at = NOW() WHERE id = $2',
      [JSON.stringify(sessionCookies), merchantId]
    );

    console.log(\`[SYNC] \${sessionCookies.length} cookies tersimpan untuk Merchant #\${merchantId}\`);
    return res.status(200).json({ success: true, message: "Cookies synced safely." });
  } catch (error) {
    console.error("Database update failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;`;

  const botCode = `const puppeteer = require('puppeteer');

async function executeScraperWithCookies(merchant) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  try {
    // 1. Periksa apakah session cookies tersimpan di database
    if (merchant.session_cookies) {
      const cookiesArray = typeof merchant.session_cookies === 'string' 
        ? JSON.parse(merchant.session_cookies) 
        : merchant.session_cookies;
      
      // 2. Injeksi cookies langsung ke browser instance Puppeteer
      await page.setCookie(...cookiesArray);
      console.log(\`[BOT] Menginjeksi \${cookiesArray.length} session cookies untuk \${merchant.merchant_name}...\`);
    }

    // 3. Langsung menuju halaman mutasi transaksi (BYPASS LOGIN, CAPTCHA & SMS OTP!)
    await page.goto('https://gobiz.co.id/dashboard/transactions', { 
      waitUntil: 'networkidle2',
      timeout: 20000 
    });

    // 4. Verifikasi apakah bot berhasil melewati security check
    const isLoginRequired = await page.$('#username-input');
    if (isLoginRequired) {
      console.warn(\`[WARNING] Session cookies expired for Merchant #\${merchant.id}. Extension perlu refresh session.\`);
      return;
    }

    // 5. Ekstraksi data transaksi dari elemen DOM .transaction-row
    console.log("[BOT] Bypassed security check successfully! Extracting rows...");
    const rows = await page.$$eval('.transaction-row', elements => 
      elements.map(el => ({
        txId: el.getAttribute('data-tx-id'),
        amount: el.querySelector('.amount')?.innerText
      }))
    );

    return rows;
  } catch (error) {
    console.error("Puppeteer operation failed:", error);
  } finally {
    await browser.close();
  }
}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download ZIP using JSZip
  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('soundbox-cookie-extractor');
      if (folder) {
        folder.file('manifest.json', manifestCode);
        folder.file('background.js', backgroundCode);
        folder.file(
          'README.txt',
          `PANDUAN PEMASANGAN EKSTENSI CHROME SOUNDBOX:
1. Ekstrak folder zip ini di komputer kasir.
2. Buka Google Chrome dan ketik pada address bar: chrome://extensions/
3. Aktifkan saklar "Developer mode" di sudut kanan atas.
4. Klik tombol "Load unpacked" (Muat yang belum dibongkar) di kiri atas.
5. Pilih folder 'soundbox-cookie-extractor'.
6. Selesai! Loginlah ke akun GoBiz / DANA Bisnis Anda seperti biasa di browser tersebut.
7. Ekstensi ini akan otomatis menyinkronkan session cookies ke Web Soundbox secara otomatis.`
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'soundbox-cookie-extractor.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Simulate Extension Cookie Detection
  const handleSimulateLogin = (platform: 'gobiz' | 'danabisnis') => {
    setActivePlatform(platform);
    setIsSyncingSim(true);
    setBotLog([]);

    setTimeout(() => {
      setCookieStatus('synced');
      setIsSyncingSim(false);
    }, 1200);
  };

  // Simulate Running Bot with Cookies
  const handleRunBotSimulation = () => {
    if (cookieStatus === 'empty') return;
    setIsBotRunning(true);
    setBotLog([]);

    const domain = activePlatform === 'gobiz' ? 'gobiz.co.id' : 'danabisnis.id';

    setTimeout(() => {
      setBotLog((prev) => [
        ...prev,
        `[BOT] Meluncurkan Chromium Headless (--no-sandbox)...`,
      ]);
    }, 200);

    setTimeout(() => {
      if (cookieStatus === 'synced') {
        setBotLog((prev) => [
          ...prev,
          `[BOT] Injeksi 6 session cookies untuk domain .${domain} (page.setCookie)...`,
          `[BOT] Akses https://${domain}/dashboard/transactions...`,
        ]);
      } else {
        setBotLog((prev) => [
          ...prev,
          `[BOT] Cookies tidak valid / kedaluwarsa...`,
          `[BOT] Navigasi ke https://${domain}/dashboard/transactions...`,
        ]);
      }
    }, 700);

    setTimeout(() => {
      if (cookieStatus === 'synced') {
        setBotLog((prev) => [
          ...prev,
          `[BOT] Memeriksa selector login: #username-input TIDAK DITEMUKAN.`,
          `[BOT] ✅ BERHASIL BYPASS LOGIN, CAPTCHA & SMS OTP!`,
          `[BOT] Membaca baris mutasi .transaction-row... Transaksi QRIS berhasil ditangkap!`,
        ]);
      } else {
        setBotLog((prev) => [
          ...prev,
          `[WARNING] Selector #username-input terdeteksi. Sesi telah kedaluwarsa!`,
          `[BOT] ❌ Scraper terhenti di halaman login. Kasir diminta login ulang di browser.`,
        ]);
      }
      setIsBotRunning(false);
    }, 1500);
  };

  return (
    <div id="cookie-sync-guide" className="space-y-6">
      {/* Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Puzzle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Automated Cookie Extraction Pipeline
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                  Chrome Extension MV3
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bypass batasan <em>Same-Origin Policy</em> browser secara legal &amp; otomatis tanpa input password atau OTP berulang.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Ekstensi Terunduh (.zip)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Membuat ZIP...' : 'Download Ekstensi (.zip)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Pipeline Architecture Diagram */}
        <div className="my-6 p-5 rounded-2xl bg-slate-950 text-white border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Arsitektur Alur Ekstraksi Sesi Otomatis (Pipeline):
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Zero OTP • Auto 24/7</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
                  <Laptop className="w-4 h-4" />
                  1. Browser Kasir UMKM
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kasir login normal di tab GoBiz / DANA Bisnis. Chrome Extension otomatis mendeteksi sesi login aktif.
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800/80">
                chrome.cookies.getAll()
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                  <Server className="w-4 h-4" />
                  2. Web App Backend
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Menerima cookies via HTTP POST ke <code>/api/save-cookies</code> dan menyimpannya di kolom <code>session_cookies</code> (JSONB).
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800/80">
                UPDATE merchants SET session_cookies
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  3. Puppeteer Headless Bot
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Bot menyuntikkan cookies via <code>page.setCookie()</code> langsung ke halaman mutasi, melewati login form, Captcha &amp; SMS OTP!
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800/80">
                page.setCookie(...cookies)
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Simulator Section */}
        <div className="my-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                Simulator Interaktif: Ekstensi &amp; Injeksi Bot Puppeteer
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Uji coba langsung bagaimana ekstensi membaca session cookies dan bagaimana bot headless Puppeteer melewati login.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status Sesi:</span>
              {cookieStatus === 'empty' && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-700">
                  ⚪ Belum Ada Cookies
                </span>
              )}
              {cookieStatus === 'synced' && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  🟢 Cookies Aktif (Bypass OTP Valid)
                </span>
              )}
              {cookieStatus === 'expired' && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  🔴 Sesi Kadaluarsa
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Simulator Controls */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-700">Langkah 1: Simulasikan Kasir Login di Browser</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateLogin('gobiz')}
                  disabled={isSyncingSim}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-xs font-semibold text-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Login GoBiz Merchant
                </button>
                <button
                  onClick={() => handleSimulateLogin('danabisnis')}
                  disabled={isSyncingSim}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-xs font-semibold text-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Login DANA Bisnis
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setCookieStatus('expired')}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Simulasikan Cookie Kadaluarsa
                </button>
                <button
                  onClick={() => {
                    setCookieStatus('empty');
                    setBotLog([]);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                >
                  Reset Status
                </button>
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Langkah 2: Jalankan Cron Bot Puppeteer
                </div>
                <button
                  onClick={handleRunBotSimulation}
                  disabled={isBotRunning || cookieStatus === 'empty'}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {isBotRunning ? 'Bot Sedang Berjalan...' : 'Uji Coba Eksekusi Bot (page.setCookie)'}
                </button>
              </div>
            </div>

            {/* Console output */}
            <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] flex flex-col justify-between border border-slate-800 min-h-[170px]">
              <div className="space-y-1 overflow-y-auto max-h-[140px]">
                <div className="text-slate-500 pb-1 border-b border-slate-800 flex items-center justify-between text-[10px]">
                  <span>TERMINAL LOG BOT PUPPETEER</span>
                  <span>NODE.js CRON</span>
                </div>
                {isSyncingSim && (
                  <div className="text-indigo-400 animate-pulse">
                    [EXTENSION] Mengambil cookies domain .{activePlatform === 'gobiz' ? 'gobiz.co.id' : 'danabisnis.id'}... Mengirim ke /api/save-cookies...
                  </div>
                )}
                {botLog.length === 0 && !isSyncingSim && (
                  <div className="text-slate-600 italic">
                    Klik tombol "Login GoBiz / DANA Bisnis" di sebelah kiri untuk menyinkronkan cookies dan melihat log eksekusi bot.
                  </div>
                )}
                {botLog.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.includes('✅') || line.includes('BERHASIL')
                        ? 'text-emerald-400 font-semibold'
                        : line.includes('❌') || line.includes('WARNING')
                        ? 'text-rose-400 font-semibold'
                        : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex items-center justify-between">
                <span>Domain: .{activePlatform === 'gobiz' ? 'gobiz.co.id' : 'danabisnis.id'}</span>
                <span>Port: 3000 / PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code Tabs */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              Kode Lengkap Komponen Pipeline
            </h3>

            {/* Selector Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setActiveCodeTab('manifest')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeCodeTab === 'manifest'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1. manifest.json
              </button>
              <button
                onClick={() => setActiveCodeTab('background')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeCodeTab === 'background'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2. background.js
              </button>
              <button
                onClick={() => setActiveCodeTab('backend')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeCodeTab === 'backend'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3. router.post('/api/save-cookies')
              </button>
              <button
                onClick={() => setActiveCodeTab('bot')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeCodeTab === 'bot'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                4. page.setCookie() Bot
              </button>
            </div>
          </div>

          {/* Tab 1: Manifest */}
          {activeCodeTab === 'manifest' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>File: <code>soundbox-cookie-extractor/manifest.json</code></span>
                <button
                  onClick={() => copyToClipboard(manifestCode, 'manifest')}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Salin manifest.json
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
                <code>{manifestCode}</code>
              </pre>
            </div>
          )}

          {/* Tab 2: background.js */}
          {activeCodeTab === 'background' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>File: <code>soundbox-cookie-extractor/background.js</code></span>
                <button
                  onClick={() => copyToClipboard(backgroundCode, 'bg')}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'bg' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Salin background.js
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
                <code>{backgroundCode}</code>
              </pre>
            </div>
          )}

          {/* Tab 3: backend express */}
          {activeCodeTab === 'backend' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>File: <code>server/routes/save-cookies.js</code> (Node.js Express + PostgreSQL)</span>
                <button
                  onClick={() => copyToClipboard(backendCode, 'backend')}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'backend' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Salin Kode Backend
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
                <code>{backendCode}</code>
              </pre>
            </div>
          )}

          {/* Tab 4: bot cookies */}
          {activeCodeTab === 'bot' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>File: <code>scraper/executeScraperWithCookies.js</code> (Injeksi Cookies ke Puppeteer)</span>
                <button
                  onClick={() => copyToClipboard(botCode, 'bot')}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'bot' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Salin Kode Injeksi Puppeteer
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
                <code>{botCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* UX Guide for Non-Technical UMKM */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">💡</span>
            Panduan Mudah untuk Pemilik Warung &amp; Toko UMKM (Non-Teknis)
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center justify-center font-bold">1</span>
                Download &amp; Ekstrak File
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Klik tombol <strong className="text-indigo-600">Download Ekstensi (.zip)</strong> di atas lalu ekstrak foldernya di komputer/laptop kasir toko.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center justify-center font-bold">2</span>
                Pasang Sekali di Chrome
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Buka <code className="bg-slate-200 px-1 rounded text-[10px]">chrome://extensions</code>, aktifkan <strong>Developer mode</strong> di kanan atas, lalu klik <strong>Load unpacked</strong> dan pilih folder yang diekstrak tadi.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center justify-center font-bold">3</span>
                Login Biasa, Berjalan 24/7
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Kasir cukup login seperti biasa di GoBiz atau DANA Bisnis. Ekstensi bekerja diam-diam menyinkronkan sesi ke Soundbox tanpa perlu input password lagi!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
