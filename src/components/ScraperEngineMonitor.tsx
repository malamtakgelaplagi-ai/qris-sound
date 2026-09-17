import React from 'react';
import { Terminal, Cpu, Database, Send, AlertCircle, CheckCircle2, Globe, Shield, RefreshCw } from 'lucide-react';
import { ScraperStepLog } from '../types';

interface ScraperEngineMonitorProps {
  logs: ScraperStepLog[];
  isScraping: boolean;
  onClearLogs: () => void;
  onTriggerManualScrape: () => void;
}

export const ScraperEngineMonitor: React.FC<ScraperEngineMonitorProps> = ({
  logs,
  isScraping,
  onClearLogs,
  onTriggerManualScrape,
}) => {
  return (
    <div id="scraper-engine-monitor" className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Live Scraper Engine &amp; Database Monitor
              </h3>
              {isScraping ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Scraping...
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Idle / Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Pipeline Node.js + Puppeteer Headless Browser &amp; PostgreSQL Mutasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTriggerManualScrape}
            disabled={isScraping}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            Run Scrape Now
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition cursor-pointer"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Pipeline Diagram Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-5">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
          <Globe className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-[11px] font-bold text-white">1. Headless Page</div>
          <div className="text-[10px] text-slate-400">goto('dashboard')</div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
          <Shield className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-[11px] font-bold text-white">2. Session/Auth</div>
          <div className="text-[10px] text-slate-400">Cookie / AES-256</div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
          <Cpu className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-[11px] font-bold text-white">3. DOM Extract</div>
          <div className="text-[10px] text-slate-400">.transaction-row</div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
          <Database className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-[11px] font-bold text-white">4. DB Deduplikasi</div>
          <div className="text-[10px] text-slate-400">SELECT &amp; INSERT</div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
          <Send className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <div className="text-[11px] font-bold text-white">5. WebSocket Emit</div>
          <div className="text-[10px] text-slate-400">to(merchant).emit()</div>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs border border-slate-800 h-64 overflow-y-auto space-y-2 select-text">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-center">
            Terminal siap. Kirim transaksi atau jalankan scraper untuk melihat log real-time.
          </div>
        ) : (
          logs.map((log) => {
            let badgeClass = 'text-slate-400';
            if (log.status === 'success') badgeClass = 'text-emerald-400';
            if (log.status === 'warning') badgeClass = 'text-amber-400';
            if (log.status === 'error') badgeClass = 'text-rose-400';

            return (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/50 p-1 rounded">
                <span className="text-slate-600 shrink-0 text-[10px] mt-0.5">{log.timestamp}</span>
                <span className={`font-bold shrink-0 text-[11px] ${badgeClass}`}>
                  [{log.step}]
                </span>
                <div className="flex-1">
                  <span className="text-slate-200">{log.message}</span>
                  {log.details && (
                    <div className="text-slate-400 text-[11px] mt-0.5 font-sans bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
