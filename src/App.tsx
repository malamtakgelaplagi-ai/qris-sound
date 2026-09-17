/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  HelpCircle,
  Code,
  History,
  Store,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BellRing,
  Puzzle,
} from 'lucide-react';
import { Transaction, VoiceCharacterId, ScraperStepLog } from './types';
import { speakAnnouncement, getSpokenPhrase, VOICE_CHARACTERS } from './utils/audio';
import { SoundboxCard } from './components/SoundboxCard';
import { SimulatorControls } from './components/SimulatorControls';
import { ScraperEngineMonitor } from './components/ScraperEngineMonitor';
import { TransactionHistory } from './components/TransactionHistory';
import { WhyExplanationSection } from './components/WhyExplanationSection';
import { CodeViewerSection } from './components/CodeViewerSection';
import { VercelDeploymentGuide } from './components/VercelDeploymentGuide';
import { CookieSyncSection } from './components/CookieSyncSection';

export default function App() {
  const [activeTab, setActiveTab] = useState<'soundbox' | 'history' | 'cookie-sync' | 'why' | 'code' | 'vercel'>('soundbox');
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [selectedCharacter, setSelectedCharacter] = useState<VoiceCharacterId>('laras');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [autoScrapeInterval, setAutoScrapeInterval] = useState<number | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Initial Seed Transactions in PostgreSQL representation
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      transaction_id: 'TX-202609-18491',
      merchant_id: 1,
      amount: 25000,
      payment_method: 'QRIS',
      customer_name: 'Es Kopi Susu & Toast',
      created_at: 'Hari ini, 10:14:22',
      status: 'SUCCESS',
    },
    {
      id: 2,
      transaction_id: 'TX-202609-18492',
      merchant_id: 1,
      amount: 45000,
      payment_method: 'GOPAY',
      customer_name: 'Paket Ayam Geprek Duo',
      created_at: 'Hari ini, 10:28:05',
      status: 'SUCCESS',
    },
    {
      id: 3,
      transaction_id: 'TX-202609-18493',
      merchant_id: 1,
      amount: 15000,
      payment_method: 'SHOPEEPAY',
      customer_name: 'Teh Tarik Jelly',
      created_at: 'Hari ini, 10:45:30',
      status: 'SUCCESS',
    },
  ]);

  const [latestTransaction, setLatestTransaction] = useState<{
    amount: number;
    transaction_id: string;
    timestamp: string;
    payment_method: string;
  } | null>({
    amount: 15000,
    transaction_id: 'TX-202609-18493',
    timestamp: 'Hari ini, 10:45:30',
    payment_method: 'SHOPEEPAY',
  });

  const [logs, setLogs] = useState<ScraperStepLog[]>([
    {
      id: 'log-0',
      timestamp: '10:45:29',
      step: 'LAUNCH',
      message: 'Browser Puppeteer headless diinisialisasi.',
      status: 'info',
    },
    {
      id: 'log-1',
      timestamp: '10:45:29',
      step: 'AUTH_CHECK',
      message: 'Session cookies toko dimuat (Bypass Captcha & OTP aktif).',
      status: 'info',
    },
    {
      id: 'log-2',
      timestamp: '10:45:30',
      step: 'EXTRACT',
      message: 'Baris mutasi teratas terbaca: TX-202609-18493 (Rp 15.000, SUCCESS).',
      status: 'info',
    },
    {
      id: 'log-3',
      timestamp: '10:45:30',
      step: 'DB_QUERY',
      message: 'SELECT * FROM transactions WHERE transaction_id = $1 => 0 baris (Mutasi Baru).',
      status: 'success',
    },
    {
      id: 'log-4',
      timestamp: '10:45:30',
      step: 'WS_EMIT',
      message: 'Sinyal WebSocket dipancarkan ke room toko => Spiker bersuara!',
      status: 'success',
    },
  ]);

  const autoCronTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scraped random transactions cron simulator
  useEffect(() => {
    if (autoScrapeInterval && autoScrapeInterval > 0) {
      autoCronTimerRef.current = setInterval(() => {
        const presets = [12000, 20000, 35000, 50000, 68000];
        const randomAmount = presets[Math.floor(Math.random() * presets.length)];
        const methods: ('QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'BCA')[] = [
          'QRIS',
          'GOPAY',
          'SHOPEEPAY',
          'DANA',
        ];
        const randomMethod = methods[Math.floor(Math.random() * methods.length)];
        executeScraperFlow(randomAmount, randomMethod, 'Auto-Cron Transaksi Baru');
      }, autoScrapeInterval * 1000);
    } else {
      if (autoCronTimerRef.current) {
        clearInterval(autoCronTimerRef.current);
      }
    }

    return () => {
      if (autoCronTimerRef.current) {
        clearInterval(autoCronTimerRef.current);
      }
    };
  }, [autoScrapeInterval, selectedCharacter, isActivated]);

  // Activate soundbox session
  const handleActivate = async () => {
    setIsActivated(true);
    showBanner('success', 'Sesi Kasir Aktif! Izin Audio Browser berhasil di-unlock.');
    await speakAnnouncement('Sistem spiker siap menerima pembayaran.', selectedCharacter, {
      playChimeFirst: true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const showBanner = (type: 'success' | 'warning' | 'info', message: string) => {
    setNotificationBanner({ type, message });
    setTimeout(() => {
      setNotificationBanner(null);
    }, 4500);
  };

  // Run full scraper pipeline simulation for a new transaction
  const executeScraperFlow = async (
    amount: number,
    method: 'QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'BCA',
    customerName: string
  ) => {
    if (isScraping) return;
    setIsScraping(true);

    const newTxId = `TX-${Date.now().toString().slice(-6)}`;
    const nowTime = new Date().toLocaleTimeString('id-ID');

    const addLog = (
      step: ScraperStepLog['step'],
      message: string,
      status: ScraperStepLog['status'],
      details?: string
    ) => {
      setLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          step,
          message,
          status,
          details,
        },
        ...prev.slice(0, 30),
      ]);
    };

    // Step 1: Launch Puppeteer
    addLog('LAUNCH', 'Puppeteer browser diluncurkan (headless: true, --no-sandbox)', 'info');
    await new Promise((r) => setTimeout(r, 200));

    // Step 2: Auth / Cookies check
    addLog('AUTH_CHECK', 'Memeriksa session cookies toko. Sesi aktif valid, bypass form login & OTP.', 'info');
    await new Promise((r) => setTimeout(r, 250));

    // Step 3: Navigate to mutasi
    addLog('NAVIGATE', 'Navigasi ke https://merchant.ewallet.com/transactions', 'info');
    await new Promise((r) => setTimeout(r, 300));

    // Step 4: Extract latest row
    addLog(
      'EXTRACT',
      `DOM .transaction-row ditemukan: ID=${newTxId}, Nominal=Rp ${amount.toLocaleString('id-ID')}, Status=SUCCESS`,
      'info'
    );
    await new Promise((r) => setTimeout(r, 250));

    // Step 5: Database Deduplication Check
    addLog(
      'DB_QUERY',
      `SELECT * FROM transactions WHERE transaction_id = '${newTxId}' => 0 data ditemukan. (Mutasi Baru)`,
      'success',
      'Data belum pernah tersimpan, aman untuk diproses dan disuarakan.'
    );
    await new Promise((r) => setTimeout(r, 250));

    // Step 6: Insert into PostgreSQL
    const newTx: Transaction = {
      id: transactions.length + 1,
      transaction_id: newTxId,
      merchant_id: 1,
      amount,
      payment_method: method,
      customer_name: customerName,
      created_at: `Hari ini, ${nowTime}`,
      status: 'SUCCESS',
    };

    setTransactions((prev) => [newTx, ...prev]);
    setLatestTransaction({
      amount,
      transaction_id: newTxId,
      timestamp: `Hari ini, ${nowTime}`,
      payment_method: method,
    });

    // Step 7: Emit WebSocket
    const merchantId = 1;
    addLog(
      'WS_EMIT',
      `socketIO.to(\`merchant_\${merchantId}\`).emit('pembayaran_masuk', { nominal: ${amount}, txId: '${newTxId}' })`,
      'success',
      `Sinyal terkirim ke Soundbox kasir via WebSocket (Room: merchant_${merchantId}).`
    );

    setIsScraping(false);

    // Announce voice through Soundbox
    showBanner(
      'success',
      `Pembayaran QRIS Rp ${amount.toLocaleString('id-ID')} terverifikasi!`
    );

    const phrase = getSpokenPhrase(amount);
    await speakAnnouncement(phrase, selectedCharacter, {
      playChimeFirst: true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  // Run duplicate check demonstration
  const handleSimulateDuplicatePayment = async () => {
    if (!latestTransaction || isScraping) return;
    setIsScraping(true);

    const existingTxId = latestTransaction.transaction_id;

    const addLog = (
      step: ScraperStepLog['step'],
      message: string,
      status: ScraperStepLog['status'],
      details?: string
    ) => {
      setLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          step,
          message,
          status,
          details,
        },
        ...prev.slice(0, 30),
      ]);
    };

    addLog('LAUNCH', 'Puppeteer browser diluncurkan untuk cek mutasi berkala...', 'info');
    await new Promise((r) => setTimeout(r, 200));

    addLog('EXTRACT', `Membaca baris teratas: ${existingTxId} (Nominal: Rp ${latestTransaction.amount})`, 'info');
    await new Promise((r) => setTimeout(r, 250));

    // DB Query detects existing
    addLog(
      'DB_QUERY',
      `SELECT * FROM transactions WHERE transaction_id = '${existingTxId}' => 1 baris ditemukan!`,
      'warning',
      `Transaksi sudah tercatat pada database sebelumnya.`
    );
    await new Promise((r) => setTimeout(r, 250));

    // Deduplication prevents sound
    addLog(
      'DEDUP_SKIP',
      `[DEDUKLIKASI BEKERJA] Transaksi ${existingTxId} diabaikan. WebSocket emit & suara dibatalkan!`,
      'warning',
      'Spiker TIDAK bersuara dua kali. Integritas sistem terjaga.'
    );

    setIsScraping(false);

    showBanner(
      'warning',
      `🛡️ Anti-Duplikasi Berhasil: Transaksi ${existingTxId} dicegah berbunyi dua kali!`
    );
  };

  const totalRevenueToday = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalTransactionsToday = transactions.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Web Soundbox UMKM
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Puppeteer Scraper Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Pengumuman Suara QRIS Real-time &amp; Solusi Otomasi Mutasi Tanpa Biaya API
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('soundbox')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'soundbox'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Soundbox &amp; Scraper</span>
              <span className="sm:hidden">Kasir</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mutasi DB ({transactions.length})</span>
              <span className="sm:hidden">Mutasi</span>
            </button>

            <button
              onClick={() => setActiveTab('cookie-sync')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cookie-sync'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Cookie (Ekstensi)</span>
              <span className="sm:hidden">Ekstensi</span>
            </button>

            <button
              onClick={() => setActiveTab('why')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'why'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Mengapa?</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kode Siap Pakai</span>
              <span className="sm:hidden">Kode</span>
            </button>

            <button
              onClick={() => setActiveTab('vercel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'vercel'
                  ? 'bg-black text-white shadow-sm ring-2 ring-black/20'
                  : 'text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {/* Vercel triangle icon */}
              <svg width="12" height="11" viewBox="0 0 76 65" fill="none" className="shrink-0">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
              </svg>
              <span>Vercel (Vite)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {notificationBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              notificationBanner.type === 'success'
                ? 'bg-emerald-600 text-white'
                : notificationBanner.type === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 shrink-0 animate-bounce" />
              <span>{notificationBanner.message}</span>
            </div>
            <button
              onClick={() => setNotificationBanner(null)}
              className="text-white/80 hover:text-white text-xs underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* TAB 1: Soundbox & Scraper Simulator */}
        {activeTab === 'soundbox' && (
          <div className="space-y-6">
            {/* Top row: Soundbox Hardware Visual on the left, Trigger Simulator on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6">
                <SoundboxCard
                  isActivated={isActivated}
                  onActivate={handleActivate}
                  selectedCharacter={selectedCharacter}
                  onSelectCharacter={setSelectedCharacter}
                  latestTransaction={latestTransaction}
                  isSpeaking={isSpeaking}
                  totalRevenueToday={totalRevenueToday}
                  totalTransactionsToday={totalTransactionsToday}
                />
              </div>

              <div className="lg:col-span-6 space-y-6">
                <SimulatorControls
                  onSimulateNewPayment={(amt, method, name) => executeScraperFlow(amt, method, name)}
                  onSimulateDuplicatePayment={handleSimulateDuplicatePayment}
                  lastTxId={latestTransaction ? latestTransaction.transaction_id : null}
                  isScraping={isScraping}
                  autoScrapeInterval={autoScrapeInterval}
                  onToggleAutoScrape={setAutoScrapeInterval}
                />

                {/* Quick explanation summary card for "Mengapa" */}
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-xs text-blue-900 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 shrink-0 text-blue-700 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-blue-950 flex items-center gap-2">
                      Pertanyaan Anda: "Mengapa arsitektur ini dibangun seperti ini?"
                    </div>
                    <p className="mt-1 leading-relaxed text-blue-800">
                      Scraper Puppeteer memungkinkan UMKM membaca mutasi e-wallet secara <strong>100% gratis</strong> tanpa birokrasi izin PT/CV bank. Tombol aktivasi diperlukan untuk membuka kunci <strong>Browser Autoplay Policy</strong>, dan tabel database dengan <strong>UNIQUE transaction_id</strong> mencegah spiker berbunyi dua kali saat cron berjalan.
                    </p>
                    <button
                      onClick={() => setActiveTab('why')}
                      className="mt-2.5 inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                    >
                      Buka Rangkuman Lengkap &amp; Tanya Jawab Arsitektur →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Scraper Engine & Database Monitor */}
            <ScraperEngineMonitor
              logs={logs}
              isScraping={isScraping}
              onClearLogs={() => setLogs([])}
              onTriggerManualScrape={() => executeScraperFlow(30000, 'QRIS', 'Manual Trigger Kasir')}
            />

            {/* Short preview of recent transactions */}
            <TransactionHistory
              transactions={transactions.slice(0, 5)}
              onClearHistory={() => setTransactions([])}
              selectedCharacter={selectedCharacter}
            />
          </div>
        )}

        {/* TAB 2: Full Transaction History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <TransactionHistory
              transactions={transactions}
              onClearHistory={() => setTransactions([])}
              selectedCharacter={selectedCharacter}
            />

            {/* Merchant Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                Data Toko / Merchant (Tabel PostgreSQL `merchants`)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi kredensial scraper yang tersimpan dengan enkripsi aman.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-400 text-[11px]">Nama Merchant:</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">Kedai Kopi Berkah UMKM</div>
                  <div className="text-slate-500 text-[10px] mt-1">Merchant ID: #1</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-400 text-[11px]">Username E-Wallet:</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">kedaiberkah_bisnis</div>
                  <div className="text-slate-500 text-[10px] mt-1">Provider: GoBiz / GoPay Merchant</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-400 text-[11px]">Status Kredensial &amp; Sesi:</div>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Terenkripsi AES-256 (Cookies Aktif)
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">Status Scraper: AKTIF (is_scraper_active: true)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2.5: Automated Cookie Extraction Pipeline (Chrome Extension) */}
        {activeTab === 'cookie-sync' && (
          <div className="space-y-6">
            <CookieSyncSection />
          </div>
        )}

        {/* TAB 3: Why Architecture Guide (Directly answering "mengapa") */}
        {activeTab === 'why' && (
          <div className="space-y-6">
            <WhyExplanationSection />
          </div>
        )}

        {/* TAB 4: Production Code Viewers */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <CodeViewerSection />
          </div>
        )}

        {/* TAB 5: Vercel Vite Deployment Guide */}
        {activeTab === 'vercel' && (
          <div className="space-y-6">
            <VercelDeploymentGuide />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Web Soundbox UMKM &bull; Arsitektur Scraper Mutasi Real-Time dengan Node.js + Puppeteer &amp; Web Speech API
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Mengimplementasikan variasi karakter suara resmi (Kak Laras, Ci Amoy, Pakde Slamet) dan sistem deduplikasi PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}
