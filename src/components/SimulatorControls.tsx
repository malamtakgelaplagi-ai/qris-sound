import React, { useState } from 'react';
import { PlayCircle, RefreshCw, Layers, Zap, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../utils/audio';

interface SimulatorControlsProps {
  onSimulateNewPayment: (amount: number, method: 'QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'BCA', customerName: string) => void;
  onSimulateDuplicatePayment: () => void;
  lastTxId: string | null;
  isScraping: boolean;
  autoScrapeInterval: number | null; // null = off, 10 = 10s, 30 = 30s
  onToggleAutoScrape: (interval: number | null) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  onSimulateNewPayment,
  onSimulateDuplicatePayment,
  lastTxId,
  isScraping,
  autoScrapeInterval,
  onToggleAutoScrape,
}) => {
  const [customAmount, setCustomAmount] = useState<string>('35000');
  const [selectedMethod, setSelectedMethod] = useState<'QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'BCA'>('QRIS');
  const [customerName, setCustomerName] = useState<string>('Pelanggan Meja 4');

  const presetAmounts = [15000, 25000, 50000, 75000, 100000];

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customAmount.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      onSimulateNewPayment(parsed, selectedMethod, customerName);
    }
  };

  return (
    <div id="simulator-panel" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Simulasi Trigger Transaksi &amp; Uji Spiker
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulasikan pembeli men-scan QRIS untuk menguji respons scraper, database, dan pemutar suara kasir.
          </p>
        </div>

        {/* Auto Scrape Cron toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <span className="text-slate-600 px-2 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Cron Job:
          </span>
          <button
            type="button"
            onClick={() => onToggleAutoScrape(null)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              autoScrapeInterval === null ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => onToggleAutoScrape(10)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              autoScrapeInterval === 10 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tiap 10s
          </button>
          <button
            type="button"
            onClick={() => onToggleAutoScrape(25)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              autoScrapeInterval === 25 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tiap 25s
          </button>
        </div>
      </div>

      {/* Preset nominal buttons */}
      <div className="mt-5">
        <label className="text-xs font-semibold text-slate-700 block mb-2">
          Pilih Nominal Cepat (Sekali Klik):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {presetAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={isScraping}
              onClick={() => onSimulateNewPayment(amt, selectedMethod, customerName)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 font-bold text-sm text-slate-800 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {formatRupiah(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount Form */}
      <form onSubmit={handleSubmitCustom} className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-3">
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Metode Pembayaran:
          </label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as any)}
            className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="QRIS">QRIS All Payment</option>
            <option value="GOPAY">GoPay / GoBiz</option>
            <option value="SHOPEEPAY">ShopeePay</option>
            <option value="OVO">OVO Merchant</option>
            <option value="DANA">DANA Bisnis</option>
            <option value="BCA">BCA QRIS</option>
          </select>
        </div>

        <div className="sm:col-span-4">
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Catatan Pelanggan / Kasir:
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Contoh: Meja 3 / Bpk. Budi"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Nominal Kustom (Rp):
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isScraping}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            Kirim QRIS
          </button>
        </div>
      </form>

      {/* Deduplication Test Button */}
      <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900">
              Uji Coba Mutasi Duplikat (Bukti Anti-Duplikasi Suara)
            </div>
            <div className="text-[11px] text-amber-700 leading-tight mt-0.5">
              Klik tombol ini untuk mengirim mutasi dengan ID yang sama ({lastTxId || 'TX-...'}) ke backend scraper. Sistem akan mendeteksi transaksi sudah ada di PostgreSQL dan TIDAK AKAN membunyikan spiker dua kali.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSimulateDuplicatePayment}
          disabled={!lastTxId || isScraping}
          className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Uji Kirim Duplikat
        </button>
      </div>
    </div>
  );
};
