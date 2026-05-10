"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useUIStore } from "@/store/useUIStore";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  ChevronUp, ChevronDown, Plus, Music, Loader2, Check, Users, Sparkles
} from "lucide-react";
import SyncedLyricsView from "./SyncedLyricsView";
import { useRoomStore } from "@/store/useRoomStore";
import SyncRoomModal from "./SyncRoomModal";

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isBuffering,
    togglePlay,
    seekTo,
    setVolume,
    setIsMuted,
  } = usePlayerStore();

  const { queue, currentIndex, playFromQueue, removeFromQueue, nextSong, prevSong } = useQueueStore();
  const { playlists, createPlaylist, addSongToPlaylist } = useLibraryStore();
  const { setSelectedArtistId, setSelectedAlbumId } = useUIStore();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"player" | "lyrics" | "queue" | "recommendations">("player");
  const [showPlaylistModal, setShowPlaylistModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>("");
  const [addedStatus, setAddedStatus] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const { isConnected, role } = useRoomStore();
  const isGuest = isConnected && role === "guest";

  // Keyboard shortcut listeners (Space for play/pause, Left/Right for seek, Esc to collapse)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
      // Lock keyboard controls for Guest in Sync Room to prevent local desyncs
      if (isGuest && (e.code === "Space" || e.code === "ArrowLeft" || e.code === "ArrowRight")) {
        e.preventDefault();
        return;
      }
      
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 5));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seekTo(Math.min(duration, currentTime + 5));
      } else if (e.code === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekTo, currentTime, duration, isExpanded, isGuest]);

  if (!currentSong) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    seekTo(value);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addSongToPlaylist(playlistId, currentSong);
    setAddedStatus(prev => ({ ...prev, [playlistId]: true }));
    setTimeout(() => {
      setAddedStatus(prev => ({ ...prev, [playlistId]: false }));
    }, 1500);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    
    createPlaylist(newPlaylistTitle);
    
    setTimeout(() => {
      const updatedPlaylists = useLibraryStore.getState().playlists;
      const latest = updatedPlaylists[0];
      if (latest) {
        addSongToPlaylist(latest.id, currentSong);
      }
    }, 100);

    setNewPlaylistTitle("");
  };

  return (
    <>
      {/* 1. MINI PLAYER (STICKY AT BOTTOM) */}
      <div 
        className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 h-20 border-t border-white/5 bg-[#07070a]/95 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-30 select-none shadow-2xl transition-all duration-300"
        onClick={() => setIsExpanded(true)}
      >
        {/* Track details (Left) */}
        <div className="flex items-center gap-3 max-w-[60%] md:max-w-[30%]">
          <div 
            className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 cursor-pointer group/thumb shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              if (currentSong.album?.id) {
                setSelectedAlbumId(currentSong.album.id);
              } else {
                setIsExpanded(true);
              }
            }}
          >
            <Image 
              src={currentSong.thumbnail} 
              alt={currentSong.title}
              fill
              className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
            />
          </div>
          <div className="truncate flex flex-col justify-center">
            <h4 
              onClick={() => setIsExpanded(true)}
              className="text-xs font-bold text-white truncate hover:text-[#ff004f] cursor-pointer transition-colors"
            >
              {currentSong.title}
            </h4>
            
            {/* Clickable Artist link! */}
            <div className="text-[10px] text-muted-foreground truncate flex flex-wrap gap-0.5 items-center mt-0.5">
              {currentSong.artistsList && currentSong.artistsList.length > 0 ? (
                currentSong.artistsList.map((art, idx) => (
                  <span key={idx} className="inline-flex items-center">
                    {art.id ? (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArtistId(art.id);
                        }}
                        className="hover:text-[#ff004f] hover:underline cursor-pointer transition-all font-semibold"
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

              {currentSong.album && currentSong.album.id && (
                <>
                  <span className="mx-1 text-white/10">•</span>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAlbumId(currentSong.album?.id);
                    }}
                    className="hover:text-[#ff004f] hover:underline cursor-pointer transition-all font-medium"
                  >
                    {currentSong.album.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Playback Controls & Progress (Center) */}
        <div className="hidden md:flex flex-col items-center gap-1.5 flex-1 max-w-[40%]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-6">
            <button 
              onClick={prevSong} 
              disabled={isGuest}
              className="text-muted-foreground hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={togglePlay} 
              disabled={isGuest}
              className="w-9 h-9 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
              title={isGuest ? "Kontrol dikunci (Mengikuti Host)" : "Play/Pause"}
            >
              {isBuffering ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : isPlaying ? (
                <Pause size={16} fill="white" />
              ) : (
                <Play size={16} fill="white" className="ml-0.5" />
              )}
            </button>
            <button 
              onClick={nextSong} 
              disabled={isGuest}
              className="text-muted-foreground hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Progress Seekbar */}
          <div className="flex items-center gap-3 w-full text-[10px] text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <div className="relative w-full group flex items-center">
              <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressChange}
                disabled={isGuest}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[#ff004f] group-hover:h-1.5 transition-all"
                title={isGuest ? "Navigasi waktu dikunci (Mengikuti Host)" : "Geser Lagu"}
              />
              <div 
                className="absolute left-0 top-0 h-1 bg-[#ff004f] rounded-lg pointer-events-none group-hover:h-1.5 transition-all" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Fullscreen Toggle (Right) */}
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {/* Volume Control Slider */}
          <div className="hidden md:flex items-center gap-2 group/vol">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff004f] opacity-0 group-hover/vol:opacity-100 transition-all duration-300"
            />
          </div>

          <button 
            onClick={() => setIsExpanded(true)}
            className="text-muted-foreground hover:text-white transition-colors cursor-pointer"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>

      {/* 2. FULLSCREEN EXPANDED PLAYER PANEL */}
      <div 
        className={`fixed inset-0 z-40 bg-[#040406]/98 backdrop-blur-3xl flex flex-col select-none transition-all duration-500 ease-out font-sans ${
          isExpanded ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Expanded Header Navbar */}
        <header className="relative z-10 flex items-center justify-between p-6 shrink-0 border-b border-white/5 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer border border-white/5"
            >
              <ChevronDown size={18} />
            </button>
            <button 
              onClick={() => {
                setIsExpanded(false);
                router.push("/now-playing");
              }}
              className="px-3.5 py-2 rounded-full bg-[#ff004f]/15 hover:bg-[#ff004f]/25 text-[#ff004f] hover:scale-105 transition-all cursor-pointer border border-[#ff004f]/20 font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
              title="Gaya Premium Fullscreen"
            >
              <Sparkles size={11} className="animate-pulse text-[#ff004f]" />
              <span>Immersive</span>
            </button>
          </div>

          {/* Premium Selector tab bar */}
          <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/5 shadow-inner">
            {["player", "lyrics", "queue"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#ff004f] text-white shadow-md font-black"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab === "player" ? "Lagu" : tab === "lyrics" ? "Lirik" : "Antrean"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Listening Together sync icon button with pulsing connection glow if active */}
            <button
              onClick={() => setShowSyncModal(true)}
              className={`p-2.5 rounded-full border transition-all cursor-pointer relative ${
                isConnected
                  ? "bg-[#ff004f]/10 border-[#ff004f] text-[#ff004f] shadow-lg shadow-[#ff004f]/25 animate-pulse"
                  : "bg-white/5 border-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
              title="Mendengarkan Bersama"
            >
              <Users size={18} />
              {isConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black" />
              )}
            </button>

            <button 
              onClick={() => setShowPlaylistModal(true)} 
              className="p-2.5 rounded-full bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Plus size={18} />
            </button>
          </div>
        </header>

        {/* Tab Content Wrapper */}
        <main className="relative z-10 flex-1 overflow-hidden">
          {/* TAB 1: PLAYER (ARTWORK VIEW) */}
          {activeTab === "player" && (
            <div className="h-full flex flex-col justify-around py-8 px-6 max-w-md mx-auto">
              
              {/* Premium HD Square Cover Art with Ambient Glow */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto group my-4">
                {/* Blurred backdrop ambient glow halo */}
                <div className="absolute inset-[-12px] rounded-[32px] overflow-hidden blur-3xl opacity-50 scale-105 pointer-events-none transition-all duration-1000">
                  <Image
                    src={currentSong.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Main sharp HD image container */}
                <div className="relative w-full h-full rounded-[24px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.7)] border border-white/10 bg-white/5">
                  <Image
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Title & Artist details */}
              <div className="text-center space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-white line-clamp-2 px-4 drop-shadow-md">
                  {currentSong.title}
                </h2>
                
                {/* Dynamic Clickable Subtitle inside Player Panel */}
                <div className="flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground">
                  {currentSong.artistsList && currentSong.artistsList.length > 0 ? (
                    currentSong.artistsList.map((art, idx) => (
                      <span key={idx} className="inline-flex items-center">
                        {art.id ? (
                          <span 
                            onClick={() => {
                              setSelectedArtistId(art.id);
                              setIsExpanded(false);
                            }}
                            className="text-[#ff004f] hover:underline cursor-pointer font-bold transition-all"
                          >
                            {art.name}
                          </span>
                        ) : (
                          <span className="font-semibold text-white/80">{art.name}</span>
                        )}
                        {idx < currentSong.artistsList!.length - 1 && <span className="mx-1 text-white/20">&</span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#ff004f] font-bold">{currentSong.artist}</span>
                  )}

                  {currentSong.album && currentSong.album.id && (
                    <>
                      <span className="mx-1 text-white/15">•</span>
                      <span 
                        onClick={() => {
                          setSelectedAlbumId(currentSong.album?.id);
                          setIsExpanded(false);
                        }}
                        className="hover:text-[#ff004f] hover:underline cursor-pointer font-semibold text-white/75 transition-all"
                      >
                        {currentSong.album.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Seekbar */}
              <div className="flex flex-col gap-2">
                <div className="relative group w-full flex items-center">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleProgressChange}
                    disabled={isGuest}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[#ff004f] hover:h-2 transition-all"
                    title={isGuest ? "Navigasi waktu dikunci (Mengikuti Host)" : "Geser Lagu"}
                  />
                  <div 
                    className="absolute left-0 top-0 h-1.5 bg-[#ff004f] rounded-lg pointer-events-none hover:h-2 transition-all" 
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/60 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Player buttons */}
              <div className="flex items-center justify-between px-8">
                <div className="w-10" />
                <button 
                  onClick={prevSong} 
                  disabled={isGuest}
                  className="p-3 rounded-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-white cursor-pointer active:scale-95 transition-transform"
                  title={isGuest ? "Kontrol dikunci (Mengikuti Host)" : "Lagu Sebelumnya"}
                >
                  <SkipBack size={26} />
                </button>
                <button 
                  onClick={togglePlay} 
                  disabled={isGuest}
                  className="w-16 h-16 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-45 disabled:cursor-not-allowed text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
                  title={isGuest ? "Kontrol dikunci (Mengikuti Host)" : "Play/Pause"}
                >
                  {isBuffering ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                  ) : isPlaying ? (
                    <Pause size={24} fill="white" />
                  ) : (
                    <Play size={24} fill="white" className="ml-1 text-white" />
                  )}
                </button>
                <button 
                  onClick={nextSong} 
                  disabled={isGuest}
                  className="p-3 rounded-full hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-white cursor-pointer active:scale-95 transition-transform"
                  title={isGuest ? "Kontrol dikunci (Mengikuti Host)" : "Lagu Berikutnya"}
                >
                  <SkipForward size={26} />
                </button>
                <div className="w-10" />
              </div>
            </div>
          )}

          {/* TAB 2: SYNCED LYRICS */}
          {activeTab === "lyrics" && (
            <SyncedLyricsView 
              title={currentSong.title} 
              artist={currentSong.artist} 
              songId={currentSong.id} 
            />
          )}

          {/* TAB 3: ACTIVE QUEUE */}
          {activeTab === "queue" && (
            <div className="h-full flex flex-col p-6 max-w-lg mx-auto overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-xs font-bold tracking-widest text-[#ff004f] uppercase">
                  Putar Berikutnya ({queue.length - currentIndex - 1} lagu tersisa)
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  Total antrean: {queue.length}
                </span>
              </div>

              {/* Scrollable Queue List */}
              <div className="flex-1 overflow-y-auto space-y-2 pb-24 scrollbar-none">
                {queue.map((song, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-[#ff004f]/10 border-[#ff004f]/20"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => playFromQueue(idx)}
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          {song.thumbnail ? (
                            <Image src={song.thumbnail} alt={song.title} fill className="object-cover" />
                          ) : (
                            <Music size={16} className="text-[#ff004f] m-auto" />
                          )}
                        </div>
                        <div className="truncate">
                          <h4 className={`text-sm font-bold truncate ${isCurrent ? "text-[#ff004f]" : "text-white"}`}>
                            {song.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button 
                          onClick={() => removeFromQueue(idx)}
                          className="text-xs text-muted-foreground hover:text-red-400 font-bold px-2 py-1 cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Playlist add Modal (Unchanged) */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowPlaylistModal(false)}>
          <div className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl w-full max-w-sm p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#ff004f]">Simpan ke Playlist</h3>
              <p className="text-xs text-muted-foreground">Pilih playlist untuk menyimpan lagu ini secara offline.</p>
            </div>

            {/* Create new inline form */}
            <form onSubmit={handleCreateAndAdd} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Judul playlist baru..."
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="flex-1 bg-[#16161a] border border-[#2c2c2c] focus:border-[#ff004f] rounded-xl px-3 py-2 text-xs outline-none text-white focus:ring-1 focus:ring-[#ff004f]"
              />
              <button 
                type="submit"
                className="bg-[#ff004f] hover:bg-[#ff1a5f] text-white px-3.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Buat
              </button>
            </form>

            <div className="border-t border-neutral-900 pt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-none">
              {playlists.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic text-center py-2">Belum ada playlist.</p>
              ) : (
                playlists.map(p => {
                  const added = addedStatus[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAddToPlaylist(p.id)}
                      className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span>{p.title}</span>
                      {added ? (
                        <Check size={14} className="text-[#ff004f]" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{p.songs.length} lagu</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <button 
              onClick={() => setShowPlaylistModal(false)}
              className="w-full py-2.5 rounded-xl border border-neutral-850 hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-white transition-all cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
      {/* 4. SYNC ROOM MODAL */}
      {showSyncModal && (
        <SyncRoomModal onClose={() => setShowSyncModal(false)} />
      )}
    </>
  );
}
