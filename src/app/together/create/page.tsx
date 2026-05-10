"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { 
  Radio, Shield, MessageSquare, Heart, Settings, Sliders, ArrowLeft, Loader2
} from "lucide-react";
import Link from "next/link";

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createFromSongId = searchParams.get("create_from_song");

  const { username, createRoom, isConnected, roomCode } = useRoomStore();

  const [roomName, setRoomName] = useState(username ? `${username}'s Lounge` : "My Music Lounge");
  const [allowGuestsToAddSongs, setAllowGuestsToAddSongs] = useState(true);
  const [allowGuestsToVoteSkip, setAllowGuestsToVoteSkip] = useState(true);
  const [allowGuestsToControlPlayback, setAllowGuestsToControlPlayback] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // If user connects, redirect immediately
  useEffect(() => {
    if (isConnected && roomCode) {
      router.push(`/together/room/${roomCode}`);
    }
  }, [isConnected, roomCode, router]);

  // If no username exists, bounce back to together home to set it
  useEffect(() => {
    if (!username) {
      router.push("/together");
    }
  }, [username, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    const code = await createRoom(roomName, {
      allowGuestsToAddSongs,
      allowGuestsToVoteSkip,
      allowGuestsToControlPlayback,
      chatEnabled,
      reactionsEnabled,
      maxQueueSize: 50,
      syncToleranceMs: 4500,
    });
    setLoading(false);

    if (code) {
      router.push(`/together/room/${code}`);
    }
  };

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-500">
        <Loader2 className="animate-spin text-[#ff004f]" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 select-none text-white font-sans px-4 pb-24">
      {/* Back to dashboard */}
      <Link 
        href="/together" 
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Kembali ke Dasbor</span>
      </Link>

      <div className="p-6 md:p-8 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#ff004f]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5 border-b border-white/5 pb-4">
          <h1 className="text-xl font-black uppercase tracking-wider flex items-center gap-2.5">
            <Radio className="text-[#ff004f] animate-pulse" size={20} />
            <span>Kustomisasi Kamar</span>
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
            Konfigurasikan setelan hak akses pendengar (Guest) sebelum membuka kamar Anda secara publik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name Input */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Nama Kamar Dengar</label>
            <input
              type="text"
              required
              maxLength={40}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Contoh: Senja Melow ☕..."
              className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4.5 py-3.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff004f] transition-all"
            />
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Shield size={13} className="text-[#ff004f]" />
              <span>Hak Akses Guest (Pendengar)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Permission Option 1 */}
              <div 
                onClick={() => setAllowGuestsToAddSongs(!allowGuestsToAddSongs)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  allowGuestsToAddSongs 
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 hover:border-[#ff004f]/35" 
                    : "bg-zinc-900/20 border-white/5 hover:border-white/10"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={allowGuestsToAddSongs} 
                  onChange={() => {}} 
                  className="mt-0.5 rounded text-[#ff004f] focus:ring-[#ff004f] accent-[#ff004f] pointer-events-none"
                />
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white leading-tight">Izinkan Guest Tambah Lagu</span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Guest dapat mengirimkan lagu hasil pencarian mereka ke antrean kamar.</p>
                </div>
              </div>

              {/* Permission Option 2 */}
              <div 
                onClick={() => setAllowGuestsToVoteSkip(!allowGuestsToVoteSkip)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  allowGuestsToVoteSkip 
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 hover:border-[#ff004f]/35" 
                    : "bg-zinc-900/20 border-white/5 hover:border-white/10"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={allowGuestsToVoteSkip} 
                  onChange={() => {}} 
                  className="mt-0.5 rounded text-[#ff004f] focus:ring-[#ff004f] accent-[#ff004f] pointer-events-none"
                />
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white leading-tight">Sistem Vote Skip</span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Lagu akan di-skip otomatis jika &gt;50% pendengar di dalam kamar menyetujuinya.</p>
                </div>
              </div>

              {/* Permission Option 3 */}
              <div 
                onClick={() => setAllowGuestsToControlPlayback(!allowGuestsToControlPlayback)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  allowGuestsToControlPlayback 
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 hover:border-[#ff004f]/35" 
                    : "bg-zinc-900/20 border-white/5 hover:border-white/10"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={allowGuestsToControlPlayback} 
                  onChange={() => {}} 
                  className="mt-0.5 rounded text-[#ff004f] focus:ring-[#ff004f] accent-[#ff004f] pointer-events-none"
                />
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white leading-tight">Izinkan Kontrol Putar</span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Guest dibebaskan melakukan pause, play, dan menggeser detik lagu.</p>
                </div>
              </div>

              {/* Permission Option 4 */}
              <div 
                onClick={() => setChatEnabled(!chatEnabled)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  chatEnabled 
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 hover:border-[#ff004f]/35" 
                    : "bg-zinc-900/20 border-white/5 hover:border-white/10"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={chatEnabled} 
                  onChange={() => {}} 
                  className="mt-0.5 rounded text-[#ff004f] focus:ring-[#ff004f] accent-[#ff004f] pointer-events-none"
                />
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white leading-tight">Aktifkan Obrolan Chat</span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Aktifkan kotak obrolan live teks di dalam kamar dengar secara real-time.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#ff004f]/15"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Sedang Membuat Kamar...</span>
                </>
              ) : (
                <>
                  <Radio size={14} />
                  <span>Buka Kamar Dengar Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-500">
        <Loader2 className="animate-spin text-[#ff004f]" />
      </div>
    }>
      <CreateRoomContent />
    </Suspense>
  );
}
