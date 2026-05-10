"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { 
  Users, Radio, ArrowRight, Sparkles, User, HelpCircle, Shield, Music, Zap, Tv
} from "lucide-react";
import Link from "next/link";

interface MockActiveRoom {
  code: string;
  name: string;
  host: string;
  listeners: number;
  nowPlaying: string;
}

const MOCK_ONLINE_ROOMS: MockActiveRoom[] = [
  { code: "IND012", name: "Indie Folk Senja ☕", host: "gagas_k", listeners: 14, nowPlaying: "Danilla - Senja Di Jembatan" },
  { code: "COD998", name: "Lofi Beats for Bug Hunting 💻", host: "gazal_dev", listeners: 42, nowPlaying: "Lofi Girl - Study Chill 2" },
  { code: "RET554", name: "Retro Synthwave Hype 🌃", host: "antigravity", listeners: 8, nowPlaying: "The Midnight - Sunset" },
];

function TogetherContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createFromSongId = searchParams.get("create_from_song");

  const { 
    roomCode, isConnected, username, setUsername, joinRoom 
  } = useRoomStore();

  const [usernameInput, setUsernameInput] = useState(username || "");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim().length >= 2) {
      setUsername(usernameInput.trim());
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim().length !== 6) return;
    
    setLoading(true);
    setErrorMsg("");
    const code = joinCodeInput.trim().toUpperCase();
    const success = await joinRoom(code);
    setLoading(false);
    
    if (success) {
      router.push(`/together/room/${code}`);
    } else {
      setErrorMsg("Kamar tidak ditemukan atau kode kedaluwarsa.");
    }
  };

  const handleJoinMock = async (code: string) => {
    setLoading(true);
    setErrorMsg("");
    const success = await joinRoom(code);
    setLoading(false);
    if (success) {
      router.push(`/together/room/${code}`);
    } else {
      // For mock rooms, create the room dynamically if not found so it always succeeds!
      const mock = MOCK_ONLINE_ROOMS.find(r => r.code === code);
      const generatedCode = await useRoomStore.getState().createRoom(mock?.name, {
        allowGuestsToAddSongs: true,
        allowGuestsToVoteSkip: true,
        allowGuestsToControlPlayback: true,
      });
      if (generatedCode) {
        router.push(`/together/room/${generatedCode}`);
      }
    }
  };

  // Automatically redirect if already connected to a room
  useEffect(() => {
    if (isConnected && roomCode) {
      router.push(`/together/room/${roomCode}`);
    }
  }, [isConnected, roomCode, router]);

  // 1. REQUIRE USERNAME RENDER BLOCK
  if (!username) {
    return (
      <div className="max-w-md mx-auto py-12 select-none text-white font-sans px-4">
        <div className="p-8 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-6 shadow-2xl text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-[-20%] left-[-20%] w-48 h-48 rounded-full bg-[#ff004f] opacity-[0.05] filter blur-3xl pointer-events-none animate-pulse" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff004f] to-purple-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-[#ff004f]/15 mb-4 animate-breathe">
            <Users size={32} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black uppercase tracking-wider text-white">Dengar Bersama</h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Tentukan nama panggilan Anda sebelum masuk ke ruang dengar real-time bersama teman.
            </p>
          </div>

          <form onSubmit={handleSetUsername} className="space-y-4 pt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User size={14} />
              </div>
              <input
                type="text"
                required
                placeholder="Masukkan nama panggilan Anda..."
                maxLength={20}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={usernameInput.trim().length < 2}
              className="w-full py-3.5 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#ff004f]/15"
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
    <div className="space-y-8 select-none py-4 text-white font-sans max-w-4xl mx-auto px-4 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="text-[#ff004f]" size={24} />
            <span>Mendengarkan Bersama</span>
          </h1>
          <p className="text-xs text-zinc-400 font-semibold mt-1">Sinkronisasi musik secara real-time bersama teman Anda kapan saja.</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-3 py-1.5 rounded-xl text-[10px] text-zinc-400">
          <span>Masuk sebagai: <strong className="text-white font-extrabold">{username}</strong></span>
          <button onClick={() => setUsername("")} className="text-[#ff004f] hover:underline cursor-pointer font-bold">Ganti</button>
        </div>
      </div>

      {/* DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: HOST & JOIN CARDS */}
        <div className="md:col-span-6 space-y-6">
          {/* Create Room Card */}
          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-4 hover:border-[#ff004f]/25 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff004f]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#ff004f]/10 border border-[#ff004f]/20 flex items-center justify-center text-[#ff004f]">
                <Radio size={20} className="animate-pulse" />
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase text-[#ff004f] bg-[#ff004f]/10 border border-[#ff004f]/10 px-2 py-0.5 rounded-md">👑 HOST</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Mulai Kamar Baru</h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                Buat ruang dengar Anda sendiri dan undang teman. Lagu, play/pause, dan menit detik Anda akan terinkronisasi secara langsung.
              </p>
            </div>

            <Link
              href={createFromSongId ? `/together/create?create_from_song=${createFromSongId}` : "/together/create"}
              className="w-full py-3.5 bg-[#ff004f] hover:bg-[#ff1a5f] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#ff004f]/10"
            >
              <Radio size={14} />
              Setelan & Buat Kamar
            </Link>
          </div>

          {/* Join Room Card */}
          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-4 hover:border-violet-500/25 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Users size={20} />
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase text-violet-400 bg-violet-400/10 border border-violet-400/10 px-2 py-0.5 rounded-md">👥 GUEST</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Gabung Kamar Teman</h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                Masukkan kode ruang dengar 6 karakter unik untuk mendengarkan antrean musik dan play state Host secara real-time.
              </p>
            </div>

            <form onSubmit={handleJoin} className="flex gap-2.5">
              <input
                type="text"
                placeholder="KODE KAMAR..."
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-center font-black tracking-widest text-white placeholder:font-bold placeholder:tracking-normal placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
              <button
                type="submit"
                disabled={loading || joinCodeInput.trim().length !== 6}
                className="px-4 bg-zinc-900 border border-white/10 hover:bg-violet-500 hover:border-violet-500 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <ArrowRight size={16} />
              </button>
            </form>

            {errorMsg && (
              <p className="text-[10px] font-bold text-red-400 text-center">{errorMsg}</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ONLINE ROOMS BOARD */}
        <div className="md:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-4 hover:border-emerald-500/25 transition-all relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Zap size={14} className="animate-bounce" />
                  <span>Kamar Online Terpopuler</span>
                </h3>
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/10 px-2 py-0.5 rounded-md">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                  LIVE BOARD
                </span>
              </div>

              <div className="space-y-3 py-1">
                {MOCK_ONLINE_ROOMS.map((room) => (
                  <div 
                    key={room.code}
                    onClick={() => handleJoinMock(room.code)}
                    className="p-3 bg-zinc-900/50 hover:bg-zinc-800/60 border border-white/5 rounded-2xl flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white group-hover:text-[#ff004f] transition-colors truncate">
                          {room.name}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">@{room.host}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-zinc-400 truncate flex items-center gap-1">
                        <Music size={10} className="text-[#ff004f]" />
                        {room.nowPlaying}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/10 px-2 py-0.5 rounded">
                        👥 {room.listeners}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#ff004f] group-hover:text-white transition-all">
                        <ArrowRight size={10} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help guidelines */}
            <div className="border-t border-white/5 pt-4 space-y-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <HelpCircle size={12} className="text-[#ff004f]" />
                Bagaimana Cara Kerja Sinkronisasi?
              </h4>
              <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">
                Sistem kami menggunakan polling state ringan berkecepatan tinggi (setiap 1.5 detik) yang mensinkronisasikan queue Host, play/pause, dan menit detik lagu. Semua data tersimpan in-memory pada server, memberikan sinkronisasi yang presisi dan stabil tanpa membebani peramban Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TogetherPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-500">
        <Zap className="animate-pulse text-[#ff004f]" />
      </div>
    }>
      <TogetherContent />
    </Suspense>
  );
}
