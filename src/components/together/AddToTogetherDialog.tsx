"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { useToastStore } from "@/store/useToastStore";
import { useUIStore } from "@/store/useUIStore";
import { Song } from "@/types/music";
import { useRouter } from "next/navigation";
import { X, Users, Radio, Plus, Play, ChevronRight, Sparkles, Loader2 } from "lucide-react";

interface AddToTogetherDialogProps {
  song: Song;
  onClose: () => void;
}

export default function AddToTogetherDialog({ song, onClose }: AddToTogetherDialogProps) {
  const router = useRouter();
  const { isConnected, room, role, username, setUsername, createRoom, joinRoom, addTrackToRoomQueue } = useRoomStore();
  const { addToast } = useToastStore();
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [usernameInput, setUsernameInput] = useState(username || "");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"menu" | "setup_username" | "join">("menu");
  const [targetAction, setTargetAction] = useState<"create" | "join" | null>(null);

  const handleCreateRoom = async (finalUsername: string) => {
    setLoading(true);
    try {
      // 1. Set username in store
      setUsername(finalUsername);
      
      // 2. Create room with the song as initial queue
      const nameOfRoom = roomNameInput.trim() || `${finalUsername}'s Lounge`;
      const code = await createRoom(nameOfRoom, {
        allowGuestsToAddSongs: true,
        allowGuestsToVoteSkip: true,
        allowGuestsToControlPlayback: false,
      });

      if (code) {
        // Automatically add current song
        addToast("Sesi Dengar Bersama berhasil dibuat!", "success");
        onClose();
        router.push(`/together/room/${code}`);
      } else {
        addToast("Gagal membuat sesi kamar.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Gagal membuat sesi kamar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (finalUsername: string) => {
    if (!roomCodeInput.trim() || roomCodeInput.trim().length !== 6) {
      addToast("Kode kamar harus 6 karakter.", "warning");
      return;
    }
    setLoading(true);
    try {
      setUsername(finalUsername);
      const success = await joinRoom(roomCodeInput.trim().toUpperCase());
      if (success) {
        addToast("Berhasil bergabung ke kamar!", "success");
        onClose();
        router.push(`/together/room/${roomCodeInput.trim().toUpperCase()}`);
      } else {
        addToast("Gagal bergabung ke kamar. Periksa kode kamar Anda.", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Gagal bergabung ke kamar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      addToast("Username tidak boleh kosong.", "warning");
      return;
    }

    if (targetAction === "create") {
      handleCreateRoom(usernameInput.trim());
    } else if (targetAction === "join") {
      handleJoinRoom(usernameInput.trim());
    }
  };

  const handleDirectAdd = async () => {
    if (!room) return;
    setLoading(true);
    try {
      await addTrackToRoomQueue(song);
      addToast("Lagu berhasil dikirim ke antrean kamar!", "success");
      onClose();
    } catch (err) {
      addToast("Gagal menambahkan lagu ke kamar.", "error");
    } finally {
      setLoading(false);
    }
  };

  // If already connected to a room, give direct queue send trigger or redirect
  if (isConnected && room) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div 
          className="w-full max-w-md rounded-3xl bg-[#0d0d12]/95 border border-white/10 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 font-sans text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Dengar Bersama</h3>
              <p className="text-[10px] text-zinc-400">Kamar Aktif: {room.name} ({room.id})</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 bg-zinc-900/40 p-3.5 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-[#ff004f]/10 border border-[#ff004f]/15 flex items-center justify-center text-[#ff004f] shrink-0 animate-pulse">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kirim ke Antrean Kamar</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Lagu akan ditambahkan untuk diputar bersama.</p>
              </div>
            </div>

            <button
              onClick={handleDirectAdd}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg shadow-[#ff004f]/10"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  <span>Tambahkan Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl bg-[#0d0d12]/95 border border-white/10 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 font-sans text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Mulai Dengar Bersama</h3>
            <p className="text-[10px] text-zinc-400 truncate max-w-[280px]">Mainkan "{song.title}" secara sinkron</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* MODE: MENU CHOICES */}
        {mode === "menu" && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setTargetAction("create");
                setMode("setup_username");
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ff004f]/20 to-[#ff004f]/5 border border-[#ff004f]/25 flex items-center justify-center text-[#ff004f] shrink-0">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-white group-hover:text-[#ff004f] transition-colors">Buat Kamar Baru</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Mulai sesi baru & bagikan link kamar Anda.</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => {
                setTargetAction("join");
                setMode("join");
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-300 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-white group-hover:text-zinc-300 transition-colors">Gabung Kamar Lain</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Masukkan kode kamar teman Anda.</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        )}

        {/* MODE: JOIN CODE INPUT */}
        {mode === "join" && (
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Kode Kamar (6 Karakter)</label>
              <input
                type="text"
                placeholder="CONTOH: AB12CD"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-center tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff004f]/40 transition-colors uppercase"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setMode("menu")}
                className="flex-1 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  if (!roomCodeInput.trim() || roomCodeInput.trim().length !== 6) {
                    addToast("Kode kamar harus 6 karakter.", "warning");
                    return;
                  }
                  setMode("setup_username");
                }}
                disabled={roomCodeInput.trim().length !== 6}
                className="flex-1 py-2.5 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* MODE: SETUP USERNAME */}
        {mode === "setup_username" && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4 py-1">
            {targetAction === "create" && (
              <div className="space-y-1.5 mb-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Nama Kamar (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nama kamar Anda..."
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#ff004f]/40 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Username Anda</label>
              <input
                type="text"
                placeholder="Ketik username Anda..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                autoFocus
                className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#ff004f]/40 transition-colors"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (targetAction === "join") {
                    setMode("join");
                  } else {
                    setMode("menu");
                  }
                }}
                className="flex-1 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading || !usernameInput.trim()}
                className="flex-1 py-2.5 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <Play size={10} fill="white" />
                    <span>Mulai</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
