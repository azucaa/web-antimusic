"use client";

import { useState } from "react";
import Image from "next/image";
import { useSyncStore } from "@/store/useSyncStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { 
  Users, Radio, Copy, Check, ArrowRight, Sparkles, 
  Disc, Play, Pause, LogOut, HelpCircle, User
} from "lucide-react";

export default function TogetherPage() {
  const { 
    roomCode, role, isConnected, statusMessage, 
    createRoom, joinRoom, disconnectRoom,
    username, setUsername, participants
  } = useSyncStore();

  const { currentSong, isPlaying, currentTime, duration, togglePlay } = usePlayerStore();

  const [usernameInput, setUsernameInput] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim().length >= 2) {
      setUsername(usernameInput.trim());
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    await createRoom();
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim().length !== 6) return;
    
    setLoading(true);
    const success = await joinRoom(joinCodeInput.trim());
    setLoading(false);
    
    if (success) {
      setJoinCodeInput("");
    }
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // 1. REQUIRE USERNAME RENDER BLOCK
  if (!username) {
    return (
      <div className="max-w-md mx-auto py-12 select-none text-white font-sans">
        <div className="p-8 rounded-3xl bg-[#0e0e11] border border-white/5 space-y-6 shadow-2xl text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff004f] to-purple-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-[#ff004f]/15 mb-4 animate-pulse">
            <Users size={32} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black uppercase tracking-wider text-white">Dengar Bersama</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tentukan nama panggilan Anda sebelum masuk ke ruang dengar real-time bersama teman.
            </p>
          </div>

          <form onSubmit={handleSetUsername} className="space-y-4 pt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <User size={14} />
              </div>
              <input
                type="text"
                required
                placeholder="Masukkan nama panggilan Anda..."
                maxLength={20}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={usernameInput.trim().length < 2}
              className="w-full py-3 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#ff004f]/15"
            >
              Simpan & Masuk Dasbor
            </button>
          </form>

        </div>
      </div>
    );
  }

  // 2. MAIN DASHBOARD RENDER BLOCK
  return (
    <div className="space-y-8 select-none py-4 text-white font-sans max-w-4xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="text-[#ff004f]" size={24} />
            <span>Mendengarkan Bersama</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Sinkronisasi musik secara real-time bersama teman Anda kapan saja.</p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 bg-[#ff004f]/10 border border-[#ff004f]/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#ff004f] animate-ping" />
            <span className="text-[10px] text-[#ff004f] font-black uppercase tracking-wider">Tersambung Live</span>
          </div>
        )}
      </div>

      {/* DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROL PANEL */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0e0e11] border border-white/5 space-y-6">
            
            {!isConnected ? (
              <>
                <div className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-2">
                    <Radio size={14} />
                    <span>Mulai Sebagai Host</span>
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Buat ruang dengar Anda sendiri dan biarkan teman Anda mengikutinya. Lagu dan posisi pemutaran Anda akan tersinkronisasi otomatis.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-3 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#ff004f]/10"
                  >
                    {loading ? <Sparkles className="animate-spin" size={14} /> : <Radio size={14} />}
                    Buat Ruang Dengar
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-[9px] uppercase tracking-widest text-muted-foreground/40 font-black">ATAU</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
                    <Users size={14} />
                    <span>Gabung Ruang Teman</span>
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Masukkan kode ruang dengar 6 karakter yang dibagikan oleh teman Anda untuk mulai mendengarkan bersama secara langsung.
                  </p>
                  <form onSubmit={handleJoin} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="KODE RUANG..."
                      maxLength={6}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#16161a] border border-white/10 rounded-2xl px-4 py-3 text-xs text-center font-black tracking-widest text-white placeholder:font-bold placeholder:tracking-normal placeholder-muted-foreground outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loading || joinCodeInput.trim().length !== 6}
                      className="px-4 bg-white/5 hover:bg-[#ff004f] hover:text-white disabled:opacity-50 disabled:hover:bg-white/5 border border-white/10 hover:border-transparent text-muted-foreground rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <span className="inline-block text-[10px] uppercase tracking-widest text-muted-foreground/60 font-black">Kode Ruang Anda</span>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-3xl font-black tracking-widest text-white">{roomCode}</span>
                    <button 
                      onClick={handleCopyLink}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer"
                      title="Salin Kode"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Peran Anda:</span>
                    <span className="font-bold uppercase tracking-wider text-[#ff004f]">
                      {role === "host" ? "👑 Host (Pengendali)" : "👥 Guest (Mendengar)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Keadaan:</span>
                    <span className="font-bold text-green-400">Sinkron Real-time</span>
                  </div>
                </div>

                {/* List of active participants inside the room */}
                {participants && participants.length > 0 && (
                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1.5">
                    <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-black">Pendengar Aktif ({participants.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {participants.map((name, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[9px] font-semibold text-white">
                          <span className="w-1 h-1 rounded-full bg-green-500 animate-ping" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground leading-relaxed italic bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                  {role === "host" 
                    ? "Bagikan kode unik di atas. Lagu, play/pause, dan menit detik yang Anda dengar akan otomatis diikuti oleh teman Anda!"
                    : "Anda tersambung dalam ruang dengar Host. Pemutar musik Anda mengikuti Host sepenuhnya."}
                </p>

                <button
                  onClick={disconnectRoom}
                  className="w-full py-3 bg-red-950/25 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <LogOut size={14} /> Putus Sambungan
                </button>
              </div>
            )}

            {/* Change username option footer */}
            <div className="border-t border-white/5 pt-3.5 flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Masuk sebagai: <strong className="text-white">{username}</strong></span>
              <button 
                onClick={() => setUsername("")} 
                className="text-[#ff004f] hover:underline cursor-pointer font-bold"
              >
                Ganti Nama
              </button>
            </div>

            {statusMessage && (
              <div className="text-[10px] text-center text-muted-foreground/80 font-medium leading-relaxed p-2.5 bg-white/5 rounded-xl border border-white/5">
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SYNC PANEL / PLAYER */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0e0e11] border border-white/5 h-full flex flex-col justify-between min-h-[380px]">
            
            {/* Sync visualization banner */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] mb-3 flex items-center gap-2">
                <Disc className="animate-[spin_10s_linear_infinite]" size={14} />
                <span>Pemutar Musik Tersinkronisasi</span>
              </h2>

              {currentSong ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 mt-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <Image src={currentSong.thumbnail} alt={currentSong.title} fill className="object-cover" />
                  </div>
                  <div className="truncate flex-grow">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#ff004f] transition-colors">
                      {currentSong.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{currentSong.artist}</p>
                    
                    {/* Compact duration text */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <button
                    onClick={togglePlay}
                    disabled={role === "guest"}
                    className="w-10 h-10 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95"
                    title={role === "guest" ? "Hanya Host yang bisa mengontrol" : "Play/Pause"}
                  >
                    {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground leading-relaxed italic bg-white/5 rounded-2xl border border-white/5 border-dashed mt-4">
                  Belum ada lagu yang sedang diputar. Cari lagu kesukaan Anda di menu Search untuk memulai!
                </div>
              )}
            </div>

            {/* Feature introduction section */}
            <div className="border-t border-white/5 pt-6 space-y-4 mt-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#ff004f]" />
                Bagaimana Cara Menggunakannya?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[10px] text-muted-foreground leading-relaxed">
                <div className="space-y-1">
                  <span className="block font-bold text-white uppercase tracking-wide">1. Buat Ruang</span>
                  <p>Klik tombol <strong>Buat Ruang Dengar</strong> untuk mendaftarkan ruang Anda di server, lalu salin kodenya ke teman.</p>
                </div>
                <div className="space-y-1">
                  <span className="block font-bold text-white uppercase tracking-wide">2. Sinkron Instan</span>
                  <p>Setelah teman bergabung, setiap kali Anda memutar, menjeda, memindahkan, atau menggeser lagu, mereka akan mendengarkan di detik yang sama secara instan!</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
