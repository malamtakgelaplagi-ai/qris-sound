import React, { useState } from 'react';
import { History, Search, Volume2, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { Transaction, VoiceCharacterId } from '../types';
import { formatRupiah, speakAnnouncement, getSpokenPhrase } from '../utils/audio';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClearHistory: () => void;
  selectedCharacter: VoiceCharacterId;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onClearHistory,
  selectedCharacter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlayingTxId, setActivePlayingTxId] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    return (
      tx.transaction_id.toLowerCase().includes(term) ||
      (tx.customer_name && tx.customer_name.toLowerCase().includes(term)) ||
      tx.amount.toString().includes(term) ||
      tx.payment_method.toLowerCase().includes(term)
    );
  });

  const handleReplay = async (tx: Transaction) => {
    setActivePlayingTxId(tx.transaction_id);
    const phrase = getSpokenPhrase(tx.amount);
    await speakAnnouncement(phrase, selectedCharacter, {
      playChimeFirst: true,
      onEnd: () => setActivePlayingTxId(null),
    });
  };

  return (
    <div id="transaction-history-table" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Tabel Riwayat Transaksi (PostgreSQL: `transactions`)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar mutasi yang telah tersimpan di database dan lolos pemeriksaan deduplikasi unik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID/Nominal/Metode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>
          {transactions.length > 0 && (
            <button
              onClick={onClearHistory}
              title="Kosongkan riwayat"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-y border-slate-200">
            <tr>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">ID Transaksi (Unique)</th>
              <th className="py-3 px-4">Metode</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4 text-right">Nominal</th>
              <th className="py-3 px-4 text-center">Status DB</th>
              <th className="py-3 px-4 text-center">Aksi Suara</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Belum ada mutasi tersimpan. Gunakan panel simulasi di atas untuk mengirim mutasi baru.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{tx.created_at}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {tx.transaction_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {tx.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{tx.customer_name || 'Pembeli QRIS'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Tersimpan
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleReplay(tx)}
                      disabled={activePlayingTxId === tx.transaction_id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <Volume2 className="w-3 h-3" />
                      {activePlayingTxId === tx.transaction_id ? 'Bersuara...' : 'Putar Ulang'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
