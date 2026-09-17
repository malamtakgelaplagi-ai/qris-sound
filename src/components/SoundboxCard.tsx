import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Play, ShieldCheck, Wifi, Radio } from 'lucide-react';
import { VoiceCharacterId } from '../types';
import { VOICE_CHARACTERS, speakAnnouncement, formatRupiah } from '../utils/audio';

interface SoundboxCardProps {
  isActivated: boolean;
  onActivate: () => void;
  selectedCharacter: VoiceCharacterId;
  onSelectCharacter: (char: VoiceCharacterId) => void;
  latestTransaction: {
    amount: number;
    transaction_id: string;
    timestamp: string;
    payment_method: string;
  } | null;
  isSpeaking: boolean;
  totalRevenueToday: number;
  totalTransactionsToday: number;
}

export const SoundboxCard: React.FC<SoundboxCardProps> = ({
  isActivated,
  onActivate,
  selectedCharacter,
  onSelectCharacter,
  latestTransaction,
  isSpeaking,
  totalRevenueToday,
  totalTransactionsToday,
}) => {
  const [volume, setVolume] = useState<number>(0.9);
  const [playChimeEnabled, setPlayChimeEnabled] = useState<boolean>(true);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    const char = VOICE_CHARACTERS[selectedCharacter];
    await speakAnnouncement(char.samplePhrase, selectedCharacter, {
      playChimeFirst: playChimeEnabled,
      volume,
      onEnd: () => setIsTestingVoice(false),
    });
  };

  return (
    <div id="soundbox-hardware-card" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
      {/* Decorative top grill / sound wave accent */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Web Soundbox UMKM</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Status Sistem: <span className="text-emerald-400 font-medium">Terhubung ke WebSocket Server</span>
            </p>
          </div>
        </div>

        {/* Activation Button (Autoplay Policy Unlock) */}
        <div>
          {!isActivated ? (
            <button
              id="btn-start-session"
              onClick={onActivate}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              Mulai Sesi Kasir &amp; Aktifkan Suara
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              🔒 Suara Kasir Siap Aktif
            </div>
          )}
        </div>
      </div>

      {/* Main Display / Status Box */}
      <div className="my-6">
        <div
          id="display-transaksi"
          className={`relative rounded-2xl p-6 sm:p-8 transition-all text-center border-2 ${
            latestTransaction
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950/60 border-dashed border-slate-700'
          }`}
        >
          {/* Visual speaker wave pulse if speaking */}
          {isSpeaking && (
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping pointer-events-none opacity-40" />
          )}

          <div className="flex justify-center mb-3">
            {latestTransaction ? (
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold border border-emerald-500/40 animate-bounce">
                🔊
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                <Wifi className="w-6 h-6 animate-pulse text-slate-400" />
              </div>
            )}
          </div>

          {latestTransaction ? (
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-400 mb-1">
                {latestTransaction.payment_method} QRIS DITERIMA
              </div>
              <div className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {formatRupiah(latestTransaction.amount)}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                ID Transaksi: <span className="text-slate-200">{latestTransaction.transaction_id}</span> • {latestTransaction.timestamp}
              </div>
              {isSpeaking && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Spiker sedang membacakan nominal...
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xl sm:text-2xl font-semibold text-slate-300">Menunggu Pembayaran...</p>
              <p className="text-xs text-slate-500 mt-1">
                Arahkan pelanggan untuk scan kode QRIS toko. Suara otomatis berbunyi begitu saldo masuk.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Karakter Suara Spiker Ala GoPay / ShopeePay Spiker */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="karakter-suara-select" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Pilih Karakter Suara Spiker:
          </label>
          <button
            onClick={handleTestVoice}
            disabled={isTestingVoice}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            {isTestingVoice ? 'Memutar Suara...' : 'Tes Karakter Terpilih'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(VOICE_CHARACTERS) as VoiceCharacterId[]).map((charId) => {
            const char = VOICE_CHARACTERS[charId];
            const isSelected = selectedCharacter === charId;

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char.id)}
                className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-400'
                    : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{char.avatar}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
                    Pitch {char.pitch}x
                  </span>
                </div>
                <div className="font-bold text-sm text-white">{char.name}</div>
                <div className="text-xs text-slate-400 font-medium">{char.tagline}</div>
                <div className="text-[11px] text-slate-400/80 mt-1 line-clamp-2 leading-relaxed">
                  {char.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound Settings & Today Stats */}
      <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Volume2 className="w-3.5 h-3.5" /> Volume Spiker ({Math.round(volume * 100)}%)
            </span>
            {volume === 0 && <span className="text-rose-400 font-bold">MUTE</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVolume((v) => (v === 0 ? 0.9 : 0))}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={playChimeEnabled}
              onChange={(e) => setPlayChimeEnabled(e.target.checked)}
              className="accent-blue-500 rounded cursor-pointer"
            />
            <span>Nyalakan nada lonceng (Ding-Dong) sebelum suara</span>
          </label>
        </div>

        {/* Today Summary */}
        <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ringkasan Kasir Hari Ini</span>
            <span className="text-emerald-400 font-semibold">{totalTransactionsToday} Transaksi</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-slate-400">Total Pemasukan:</div>
            <div className="text-xl font-bold text-emerald-400">
              {formatRupiah(totalRevenueToday)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
