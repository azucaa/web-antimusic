"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useUIStore } from "@/store/useUIStore";
import { SafeImage as Image } from "@/components/common/SafeImage";
import { 
  Heart, Play, Pause, SkipForward, Users, Radio, 
  RefreshCw, ListMusic, ChevronRight, Volume2, Sparkles, AlertCircle, X
} from "lucide-react";
import Link from "next/link";

export default function RightMusicPanel() {
  const { currentSong, isPlaying, currentTime, duration, togglePlay, seekTo } = usePlayerStore();
  const { room, isConnected, role, voteSkipRoom } = useRoomStore();
  const { queue } = useQueueStore();
  const { playlists, toggleFavorite } = useLibraryStore();
  const { setSelectedArtistId, setSelectedAlbumId, setRightPanelOpen } = useUIStore();

  if (!currentSong) {
    return (
      <aside className="hidden xl:flex flex-col fixed right-0 top-0 bottom-24 w-80 border-l border-white/5 bg-[#07070a]/40 backdrop-blur-3xl z-20 p-6 text-white select-none">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 opacity-60">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 animate-pulse">
            <Radio size={24} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-300">Belum Ada Lagu</p>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">Pilih lagu dari halaman Utama atau Cari untuk memulai pemutaran.</p>
          </div>
        </div>
      </aside>
    );
  }

  const isLiked = playlists.find(p => p.id === "liked")?.songs.some(s => s.id === currentSong.id) || false;

  // Calculate sync status for together room
  const localTime = currentTime;
  const remoteTime = room?.playbackState?.positionMs || 0;
  const isRemotePlaying = room?.playbackState?.status === "playing";
  
  const diff = Math.abs(localTime - remoteTime);
  let syncStatus: "synced" | "slight" | "desync" | "inactive" = "inactive";
  if (isConnected && room) {
    if (diff < 1.5) {
      syncStatus = "synced";
    } else if (diff < 4.5) {
      syncStatus = "slight";
    } else {
      syncStatus = "desync";
    }
  }

  const handleResync = () => {
    if (room?.playbackState) {
      seekTo(room.playbackState.positionMs);
      if (room.playbackState.status === "playing" && !isPlaying) {
        togglePlay();
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <aside className="hidden xl:flex flex-col fixed right-0 top-0 bottom-24 w-80 border-l border-white/5 bg-[#07070a]/40 backdrop-blur-3xl z-20 text-white select-none overflow-y-auto scrollbar-none">
      
      {/* Scrollable container for panel content */}
      <div className="p-6 space-y-6 flex-1 flex flex-col">
        
        {/* Title / Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff004f]">Sedang Diputar</span>
            {isConnected && room && (
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-[#ff004f]/10 border border-[#ff004f]/20 text-[#ff004f] px-2 py-0.5 rounded-lg animate-pulse">
                KAMAR: {room.id}
              </span>
            )}
          </div>
          <button 
            onClick={() => setRightPanelOpen(false)}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Sembunyikan Panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* 1. HD Static Album Cover Art */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-white/10 group">
          <Image 
            src={currentSong.thumbnail} 
            alt={currentSong.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <button 
              onClick={() => togglePlay()}
              className="w-10 h-10 rounded-full bg-[#ff004f] flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
            </button>
          </div>
        </div>

        {/* 2. Track Title & Artist Link */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate">
              <h2 className="text-sm font-black text-white hover:text-[#ff004f] cursor-pointer transition-colors truncate">{currentSong.title}</h2>
              <div className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">
                {currentSong.artistsList && currentSong.artistsList.length > 0 ? (
                  currentSong.artistsList.map((art, idx) => (
                    <span key={idx} className="inline-flex items-center">
                      {art.id ? (
                        <span 
                          onClick={() => setSelectedArtistId(art.id)}
                          className="hover:text-[#ff004f] hover:underline cursor-pointer transition-colors"
                        >
                          {art.name}
                        </span>
                      ) : (
                        <span>{art.name}</span>
                      )}
                      {idx < currentSong.artistsList!.length - 1 && <span className="mx-0.5 text-white/10">&</span>}
                    </span>
                  ))
                ) : (
                  <span>{currentSong.artist}</span>
                )}
              </div>
            </div>

            <button 
              onClick={() => toggleFavorite(currentSong)}
              className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#ff004f] transition-all shrink-0 cursor-pointer"
            >
              <Heart size={16} className={isLiked ? "text-[#ff004f] fill-[#ff004f]" : ""} />
            </button>
          </div>
        </div>

        {/* 3. Compact Progress Tracker */}
        <div className="space-y-1.5 py-1">
          <div className="h-1 w-full bg-zinc-800/60 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-[#ff004f] to-[#ff2b6d] rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-zinc-500 font-bold font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* 4. Listening Together Mini Dashboard Panel */}
        {isConnected && room ? (
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Dengar Bersama</span>
              
              {/* Sync Status Badge */}
              {syncStatus === "synced" && (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-400 bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/30 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                  Synced
                </span>
              )}
              {syncStatus === "slight" && (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-400 bg-amber-950/20 px-2 py-0.5 border border-amber-900/30 rounded-full">
                  Slight Delay
                </span>
              )}
              {syncStatus === "desync" && (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase text-red-400 bg-red-950/20 px-2 py-0.5 border border-red-900/30 rounded-full">
                  Desynced
                </span>
              )}
            </div>

            {/* Room stats card */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#ff004f]" />
                <p className="text-[11px] font-bold text-white truncate">{room.name}</p>
              </div>

              {/* Online indicator / Resync Button */}
              {role === "guest" && (syncStatus === "slight" || syncStatus === "desync") && (
                <button
                  onClick={handleResync}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw size={10} className="animate-spin" />
                  <span>Resync Sekarang</span>
                </button>
              )}

              {/* Text helper constraints */}
              <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 font-bold leading-none">
                <span className="w-1 h-1 rounded-full bg-[#ff004f]" />
                <span>Host paused = everyone pauses</span>
              </div>
            </div>
            
            {/* Participant avatars row previews */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {room.participants.filter(p => p.isOnline).map((p, idx) => (
                <div 
                  key={p.id}
                  className="w-6 h-6 rounded-lg bg-[#ff004f]/10 border border-[#ff004f]/25 flex items-center justify-center text-[9px] font-bold text-white shrink-0 cursor-help"
                  title={`${p.name} (${p.role === "host" ? "Host" : "Guest"})`}
                >
                  {p.name.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-2 border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
            <Users size={18} className="text-zinc-600" />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kamar Tidak Aktif</p>
            <p className="text-[9px] text-zinc-500 leading-relaxed max-w-[160px]">Hubungkan Dengar Bersama untuk mensinkronkan pemutaran dengan teman.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
