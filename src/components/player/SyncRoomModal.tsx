"use client";

import { useState } from "react";
import { useSyncStore } from "@/store/useSyncStore";
import { Radio, Users, Copy, Check, X, LogOut, ArrowRight, Sparkles, User } from "lucide-react";

interface SyncRoomModalProps {
  onClose: () => void;
}

export default function SyncRoomModal({ onClose }: SyncRoomModalProps) {
  const { 
    roomCode, role, isConnected, statusMessage, 
    createRoom, joinRoom, disconnectRoom, 
    username, setUsername, participants 
  } = useSyncStore();
  
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 select-none font-sans">
      <div className="w-full max-w-sm bg-[#0a0a0c]/90 border border-white/10 rounded-3xl p-6 shadow-[0_24px_50px_rgba(255,0,79,0.15)] relative animate-zoom-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff004f] to-purple-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-[#ff004f]/20 mb-3 animate-pulse">
            <Users size={22} />
          </div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Mendengarkan Bersama</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Sinkronisasi menit, detik, dan lagu secara real-time bersama teman.</p>
        </div>

        {/* 1. USERNAME CREATION SCREEN (FIRST STEP) */}
        {!username ? (
          <form onSubmit={handleSetUsername} className="space-y-4">
            <div className="space-y-2 text-center">
              <span className="block text-[10px] font-black text-[#ff004f] uppercase tracking-widest">Identitas Pendengar</span>
              <p className="text-[10px] text-muted-foreground">Buat nama tampilan sebelum memulai atau bergabung ke ruang dengar.</p>
            </div>
            
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
                className="w-full bg-[#121215] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={usernameInput.trim().length < 2}
              className="w-full py-3 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none active:scale-95 shadow-lg transition-all"
            >
              Lanjutkan ke Ruang Dengar
            </button>
          </form>
        ) : isConnected && roomCode ? (
          /* 2. ACTIVE ROOM SCREEN */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#ff004f]/5 border border-[#ff004f]/20 text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff004f]/10 text-[#ff004f] text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Radio size={10} /> Live Terhubung
              </span>
              
              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Kode Ruang Dengar</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black tracking-widest text-white select-all">{roomCode}</span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                    title="Salin Kode"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[10px] text-muted-foreground">
                <span className="font-semibold">Nama: <span className="text-white font-bold">{username}</span></span>
                <span className="font-bold uppercase tracking-wider text-white bg-white/5 px-2 py-0.5 rounded-md text-[9px]">
                  {role === "host" ? "👑 Host" : "👥 Pendengar"}
                </span>
              </div>
            </div>

            {/* List of active participants inside the room */}
            {participants && participants.length > 0 && (
              <div className="p-3 bg-[#121215]/50 border border-white/5 rounded-2xl space-y-1.5">
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

            <p className="text-[10px] text-center text-muted-foreground leading-relaxed italic">
              {role === "host" 
                ? "Bagikan kode ke teman Anda. Semua navigasi lagu dan waktu putar Anda akan tersinkron otomatis!" 
                : "Tersambung ke Host! Lagu dan progress pemutaran Anda dikendalikan oleh Host secara langsung."}
            </p>

            <button
              onClick={disconnectRoom}
              className="w-full py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <LogOut size={14} /> Putus Sambungan
            </button>
          </div>
        ) : (
          /* 3. INACTIVE HOST/JOIN ROOM MENU */
          <div className="space-y-6">
            
            {/* Host Section */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Buat Ruang Sendiri</span>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none active:scale-95 shadow-lg transition-all"
              >
                {loading ? <Sparkles className="animate-spin" size={14} /> : <Radio size={14} />}
                Jadi Host Baru
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-[9px] uppercase tracking-widest text-muted-foreground/50 font-black">ATAU</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Join Section */}
            <form onSubmit={handleJoin} className="space-y-3">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gabung Ruang Teman</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="KODE (6 Huruf)..."
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#121215] border border-white/10 rounded-xl px-4 py-3 text-sm text-center font-black tracking-widest text-white placeholder:font-bold placeholder:tracking-normal placeholder-muted-foreground outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || joinCodeInput.trim().length !== 6}
                  className="px-4 bg-white/5 hover:bg-[#ff004f] hover:text-white disabled:opacity-50 disabled:hover:bg-white/5 border border-white/10 hover:border-transparent text-muted-foreground rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Masuk sebagai: <strong className="text-white">{username}</strong></span>
              <button 
                onClick={() => setUsername("")} 
                className="text-[#ff004f] hover:underline cursor-pointer font-bold"
              >
                Ganti Nama
              </button>
            </div>

            {statusMessage && (
              <div className="text-[10px] text-center text-muted-foreground font-semibold leading-relaxed px-1 bg-white/5 py-2 rounded-xl border border-white/5">
                {statusMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
