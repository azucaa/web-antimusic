"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { 
  Settings, Sliders, ShieldCheck, Database, Trash2, 
  Sparkles, Disc, RefreshCw
} from "lucide-react";

export default function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { 
    theme, streamQuality, setTheme, setStreamQuality 
  } = useSettingsStore();

  const { clearHistory, clearPlaylists, history, playlists } = useLibraryStore();
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    setIsMounted(true);
    
    // Check local scrape server responsiveness
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/search?q=test");
        if (res.ok) setBackendStatus("online");
        else setBackendStatus("offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    checkStatus();
  }, []);

  const handleClearHistory = () => {
    if (confirm("Apakah Anda yakin ingin menghapus riwayat putar lokal? Tindakan ini tidak dapat dibatalkan.")) {
      clearHistory();
      alert("Riwayat mendengarkan lokal telah dihapus.");
    }
  };

  const handleClearPlaylists = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua playlist lokal? Tindakan ini tidak dapat dibatalkan.")) {
      clearPlaylists();
      alert("Playlist lokal telah dihapus.");
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[#ff004f]">
        <Disc size={40} className="animate-spin text-[#ff004f]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none max-w-2xl mx-auto py-4 text-white font-sans">
      {/* Settings Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="text-[#ff004f]" size={24} />
            <span>Pengaturan Aplikasi</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Konfigurasikan preferensi pemutar musik mandiri Anda.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: PLAYBACK CONTROLS */}
        <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/5 space-y-5 shadow-lg">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Sliders size={12} />
            <span>Konfigurasi Pemutar</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Audio Quality */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Kualitas Aliran Musik</label>
              <p className="text-[10px] text-muted-foreground">Menentukan resolusi audio yang diminta ke server pencari.</p>
              <select
                value={streamQuality}
                onChange={(e: any) => setStreamQuality(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#ff004f] cursor-pointer"
              >
                <option value="low" className="bg-[#0e0e11]">Rendah (64 kbps, Hemat Kuota)</option>
                <option value="medium" className="bg-[#0e0e11]">Standar (128 kbps, Seimbang)</option>
                <option value="high" className="bg-[#0e0e11]">Tinggi (256 kbps, Kualitas Premium)</option>
              </select>
            </div>

            {/* Theme Config */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Tema Aplikasi</label>
              <p className="text-[10px] text-muted-foreground">Pilih gaya visual antarmuka sistem.</p>
              <select
                value={theme}
                onChange={(e: any) => setTheme(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#ff004f] cursor-pointer"
              >
                <option value="dark" className="bg-[#0e0e11]">Pitch-Black (OLED Gelap)</option>
                <option value="light" className="bg-[#0e0e11]">Terang (Light Theme)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: HEALTH STATUS */}
        <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/5 space-y-4 shadow-lg">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5 border-b border-white/5 pb-3">
            <ShieldCheck size={12} />
            <span>Status Integrasi Sistem</span>
          </h2>

          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="font-bold text-white">Server Scraper Youtube Music</span>
            <div className="flex items-center gap-1.5 font-mono">
              {backendStatus === "checking" && (
                <>
                  <RefreshCw size={10} className="animate-spin text-[#ff004f]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#ff004f]">Memeriksa...</span>
                </>
              )}
              {backendStatus === "online" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-green-400">ONLINE</span>
                </>
              )}
              {backendStatus === "offline" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">OFFLINE</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: DATA MANAGEMENT */}
        <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/5 space-y-4 shadow-lg">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Database size={12} />
            <span>Manajemen Data & Privasi</span>
          </h2>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Semua riwayat pemutaran dan playlist disimpan secara lokal di peramban Anda untuk privasi total. Anda dapat menghapusnya kapan saja.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="px-4 py-3 bg-red-950/10 hover:bg-red-950/25 border border-red-900/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Trash2 size={12} />
              Hapus Riwayat ({history.length})
            </button>
            <button
              onClick={handleClearPlaylists}
              disabled={playlists.length === 0}
              className="px-4 py-3 bg-red-950/10 hover:bg-red-950/25 border border-red-900/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Trash2 size={12} />
              Hapus Semua Playlist ({playlists.length})
            </button>
          </div>
        </div>

        {/* SECTION 4: CREDITS */}
        <div className="p-6 rounded-3xl bg-[#0e0e11] border border-white/5 text-center space-y-4 relative overflow-hidden">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-36 h-36 bg-[#ff004f]/5 blur-[40px] rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff004f]/10 border border-[#ff004f]/20 text-[10px] font-bold text-[#ff004f] uppercase tracking-widest">
            <Sparkles size={10} className="animate-spin text-[#ff004f]" style={{ animationDuration: "12s" }} />
            <span>AntiMusic Project</span>
          </div>

          <h3 className="text-sm font-extrabold text-white">Sovereign Standalone Music Player</h3>
          <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
            Diformulasikan khusus untuk mengembalikan kedaulatan mendengarkan musik kepada Anda tanpa jebakan profil algoritma, umpan paksa, atau iklan interuptif. 100% milik Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
