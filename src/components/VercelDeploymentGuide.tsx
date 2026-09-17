import React, { useState } from 'react';
import { Triangle, Check, Copy, Terminal, Github, ExternalLink, Globe, Sparkles, Server, Shield, ArrowRight } from 'lucide-react';

export const VercelDeploymentGuide: React.FC = () => {
  const [activeDeployMethod, setActiveDeployMethod] = useState<'git' | 'cli' | 'config'>('git');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const vercelJsonCode = `{
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
}`;

  return (
    <div id="vercel-deployment-guide" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
      {/* Troubleshooting Alert for Failed to resolve /src/main.tsx */}
      <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row gap-3 items-start">
        <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
          !
        </div>
        <div className="space-y-1.5 text-xs text-rose-950 flex-1">
          <div className="font-bold text-sm text-rose-900 flex items-center gap-2">
            Mengatasi Error: "[vite:build-html] Failed to resolve /src/main.tsx from index.html"
          </div>
          <p className="leading-relaxed">
            Error ini berarti bundler Vite di Vercel tidak dapat menemukan berkas <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">main.tsx</code> di dalam folder <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">src/</code> saat proses build berjalan di Linux container Vercel.
          </p>
          <div className="bg-white/90 p-3.5 rounded-xl border border-rose-200 font-sans space-y-2 mt-2">
            <div className="font-semibold text-slate-900">Penyebab &amp; Solusi Cepat:</div>
            
            <div className="text-slate-700 space-y-1">
              <strong>1. Pastikan Folder <code>src/</code> Sudah Ter-Push ke GitHub:</strong>
              <p className="text-slate-600 text-[11px]">
                Buka repositori Anda di github.com. Periksa apakah folder <code>src/</code> dan file <code>src/main.tsx</code> benar-benar ada di repositori online. Jika belum, jalankan perintah ini di terminal komputer Anda:
              </p>
              <div className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono text-[11px]">
                git add . && git commit -m "Pastikan seluruh folder src terupload" && git push
              </div>
            </div>

            <div className="text-slate-700">
              <strong>2. Path Relatif di <code>index.html</code> (Sudah Diperbaiki Otomatis):</strong> Tag script telah diperbarui dari <code className="bg-slate-100 px-1 rounded font-mono">src="/src/main.tsx"</code> menjadi <code className="bg-slate-100 px-1 rounded font-mono text-emerald-700">src="./src/main.tsx"</code> agar Vite me-resolve berkas secara relatif tanpa terpengaruh konfigurasi root path server Vercel.
            </div>

            <div className="text-slate-700">
              <strong>3. Sensitivitas Huruf (Case-Sensitivity Linux):</strong> Vercel menggunakan Linux OS yang membedakan huruf besar dan kecil. Pastikan nama folder adalah <code className="bg-slate-100 px-1 rounded font-mono">src</code> (bukan <code className="bg-slate-100 px-1 rounded font-mono">Src</code>) dan berkasnya adalah <code className="bg-slate-100 px-1 rounded font-mono">main.tsx</code> (bukan <code className="bg-slate-100 px-1 rounded font-mono">Main.tsx</code>).
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Alert for Error 127 */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row gap-3 items-start">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
          !
        </div>
        <div className="space-y-1.5 text-xs text-amber-950">
          <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
            Mengatasi Error: "sh: line 1: vite: command not found (Error 127)"
          </div>
          <p className="leading-relaxed">
            Error ini terjadi karena Vercel belum menginstall folder <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">node_modules</code> sebelum menjalankan build, atau letak folder project di GitHub berada di dalam subfolder.
          </p>
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200 font-sans space-y-1.5 mt-2">
            <div className="font-semibold text-slate-900">3 Solusi Cepat:</div>
            <div className="text-slate-700">
              <strong>1. Pastikan Root Directory Benar di Vercel:</strong> Jika file <code className="bg-slate-100 px-1 rounded">package.json</code> berada di dalam subfolder repositori Anda, masuk ke <em>Vercel Dashboard &rarr; Project Settings &rarr; General &rarr; Root Directory</em> lalu arahkan ke folder tersebut.
            </div>
            <div className="text-slate-700">
              <strong>2. Matikan Override Install Command:</strong> Di <em>Project Settings &rarr; Build &amp; Development Settings</em>, pastikan tombol <strong>Install Command</strong> tidak di-override kosong (biarkan default atau isi <code className="bg-slate-100 px-1 rounded font-mono">npm install</code>).
            </div>
            <div className="text-slate-700">
              <strong>3. File vercel.json &amp; .npmrc otomatis:</strong> Proyek ini sudah diperbarui dengan konfigurasi <code className="bg-slate-100 px-1 rounded font-mono">"installCommand": "npm install"</code> dan script build <code className="bg-slate-100 px-1 rounded font-mono">npx --yes vite build</code> untuk menjamin build selalu sukses.
            </div>
          </div>
        </div>
      </div>
      {/* Header with Vercel Brand Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
            {/* Vercel Triangle Logo */}
            <svg width="22" height="20" viewBox="0 0 76 65" fill="none">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Panduan Deploy Vite ke Vercel
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-900 text-white rounded-full">
                Vite Native Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aplikasi ini sudah 100% kompatibel dengan Vite dan siap dideploy langsung ke hosting Vercel.
            </p>
          </div>
        </div>

        {/* Action Link to Vercel */}
        <a
          href="https://vercel.com/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-md shadow-black/15 cursor-pointer"
        >
          <Triangle className="w-3.5 h-3.5 fill-current" />
          <span>Buka Vercel Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Deployment Preset Summary Card */}
      <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Framework Preset</div>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Vite
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Auto-detected oleh Vercel</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Build Command</div>
          <div className="text-sm font-mono font-bold text-slate-900 mt-1">npm run build</div>
          <div className="text-[11px] text-slate-500 mt-0.5">vite build</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Output Directory</div>
          <div className="text-sm font-mono font-bold text-slate-900 mt-1">dist</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Standar static Vite bundle</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Konfigurasi vercel.json</div>
          <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-600" /> Sudah Tersedia
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">SPA routing rewrite aktif</div>
        </div>
      </div>

      {/* Tabs for Methods */}
      <div className="flex border-b border-slate-200 mb-5">
        <button
          onClick={() => setActiveDeployMethod('git')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeDeployMethod === 'git'
              ? 'border-black text-black'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Github className="w-4 h-4" />
          Metode 1: GitHub / Dashboard (Direkomendasikan)
        </button>

        <button
          onClick={() => setActiveDeployMethod('cli')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeDeployMethod === 'cli'
              ? 'border-black text-black'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Metode 2: Vercel CLI (Terminal)
        </button>

        <button
          onClick={() => setActiveDeployMethod('config')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeDeployMethod === 'config'
              ? 'border-black text-black'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          File vercel.json
        </button>
      </div>

      {/* METHOD 1: Git & Vercel Dashboard */}
      {activeDeployMethod === 'git' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <strong>Cara termudah:</strong> Hubungkan repositori GitHub/GitLab ke Vercel. Setiap kali Anda melakukan <code>git push</code>, Vercel akan otomatis meng-compile Vite dan memperbarui website secara instan dengan custom domain HTTPS gratis.
          </div>

          <ol className="space-y-3 text-xs text-slate-700 list-decimal list-inside font-medium">
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900">Upload kode ke GitHub / GitLab:</span>
              <div className="mt-2 bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] flex items-center justify-between">
                <span>git init && git add . && git commit -m "Vite Soundbox UMKM"</span>
                <button
                  onClick={() => copyToClipboard('git init && git add . && git commit -m "Vite Soundbox UMKM"', 'git-cmd')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedCmd === 'git-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </li>

            <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900">Buka Vercel Dashboard &amp; Klik "Add New Project":</span>
              <p className="text-slate-500 mt-1 pl-4">
                Pilih repositori Anda di <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com/new</a>.
              </p>
            </li>

            <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900">Konfirmasi Pengaturan Project:</span>
              <p className="text-slate-500 mt-1 pl-4">
                Vercel akan otomatis mengenali template <strong>Vite</strong>. Pastikan pengaturan berikut terisi:
              </p>
              <div className="mt-2 pl-4 space-y-1 font-mono text-[11px] text-slate-800">
                <div>• Framework Preset: <strong className="text-emerald-700">Vite</strong></div>
                <div>• Build Command: <strong>npm run build</strong></div>
                <div>• Output Directory: <strong>dist</strong></div>
              </div>
            </li>

            <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900">Klik "Deploy":</span>
              <p className="text-slate-500 mt-1 pl-4">
                Dalam ~20 detik, website Soundbox UMKM Anda akan live di URL gratis seperti <code>https://soundbox-umkm.vercel.app</code> dengan sertifikat SSL gratis!
              </p>
            </li>
          </ol>
        </div>
      )}

      {/* METHOD 2: Vercel CLI */}
      {activeDeployMethod === 'cli' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            Anda dapat mendeploy aplikasi Vite ini langsung dari terminal komputer/laptop Anda menggunakan <strong>Vercel CLI</strong>.
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">1. Install Vercel CLI secara global:</div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                <code>npm i -g vercel</code>
                <button
                  onClick={() => copyToClipboard('npm i -g vercel', 'install-vercel')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedCmd === 'install-vercel' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">2. Jalankan perintah deploy di folder project:</div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                <code>vercel</code>
                <button
                  onClick={() => copyToClipboard('vercel', 'run-vercel')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedCmd === 'run-vercel' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Jawab pertanyaan di terminal dengan menekan tombol <strong>Enter</strong> untuk menerima pengaturan default Vite.
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">3. Deploy ke Production Domain Utama:</div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                <code>vercel --prod</code>
                <button
                  onClick={() => copyToClipboard('vercel --prod', 'run-vercel-prod')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedCmd === 'run-vercel-prod' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 3: vercel.json File */}
      {activeDeployMethod === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              File <code>/vercel.json</code> (Sudah dibuat otomatis di project ini):
            </span>
            <button
              onClick={() => copyToClipboard(vercelJsonCode, 'copy-vjson')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiedCmd === 'copy-vjson' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              Salin vercel.json
            </button>
          </div>

          <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 select-text">
            <code>{vercelJsonCode}</code>
          </pre>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <strong>Catatan Penting:</strong> Konfigurasi <code>rewrites</code> di atas memastikan semua rute SPA dialihkan ke <code>/index.html</code> sehingga tidak akan muncul pesan 404 saat pengguna me-refresh halaman browser kasir di Vercel.
          </div>
        </div>
      )}

      {/* Arsitektur Hybrid: Frontend Vercel + Backend Scraper VPS */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Arsitektur Terbaik: Frontend Vite di Vercel + Backend Scraper di VPS
        </h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Mengapa memisahkan Frontend dan Scraper adalah arsitektur terbaik untuk produksi?
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400 mb-2">
              <Globe className="w-4 h-4" /> Frontend (Vite di Vercel)
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
              <li>Di-host di Edge CDN Global Vercel (kecepatan buka &lt;100ms di HP kasir).</li>
              <li>Gratis selamanya, 100% uptime, dan auto HTTPS/SSL.</li>
              <li>Menjalankan Web Speech API suara spiker kasir langsung di browser.</li>
              <li>Terhubung ke Backend lewat WebSocket URL (misal: <code>wss://api-toko.com</code>).</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 text-slate-800 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-600 mb-2">
              <Server className="w-4 h-4" /> Backend Scraper (Node.js VPS/Server)
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
              <li>Puppeteer memerlukan memori browser Chrome headless yang berjalan terus-menerus (24/7 cron).</li>
              <li>Dijalankan di VPS murah ($3–$5/bulan seperti DigitalOcean, Hetzner, atau IdCloudHost).</li>
              <li>Membaca mutasi e-wallet, memeriksa PostgreSQL, dan mengirim sinyal Socket.io ke kasir di Vercel.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
