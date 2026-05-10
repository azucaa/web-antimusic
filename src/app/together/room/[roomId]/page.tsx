"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { SafeImage as Image } from "@/components/common/SafeImage";
import { 
  Users, Radio, MessageSquare, ListMusic, Settings, LogOut, Send, 
  Smile, Flame, ThumbsUp, Heart, Sparkles, Star, Trash2, Shield, Plus, Loader2, Play, Pause, ChevronRight
} from "lucide-react";
import Link from "next/link";
import ContextMenu from "@/components/common/ContextMenu";

const EMOJIS = ["❤️", "🔥", "👍", "🥳", "😭", "😂"];

export default function SyncRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.roomId as string)?.toUpperCase();

  const { 
    room, isConnected, role, username, disconnectRoom, joinRoom,
    sendChat, sendReaction, removeTrackFromRoomQueue, voteSkipRoom, updateSettings
  } = useRoomStore();

  const { currentSong, isPlaying, currentTime, togglePlay, seekTo } = usePlayerStore();
  const { queue } = useQueueStore();

  const [activeTab, setActiveTab] = useState<"player" | "chat" | "queue" | "settings">("player");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // If disconnected, redirect back to Together dashboard
  useEffect(() => {
    if (!isConnected || !room) {
      router.push("/together");
    }
  }, [isConnected, room, router]);

  // Scroll to bottom of chat whenever messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.chat]);

  if (!isConnected || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white gap-3 font-sans">
        <Loader2 className="animate-spin text-[#ff004f]" size={36} />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Membuka Sesi Kamar...</p>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChat(chatInput.trim());
      setChatInput("");
    }
  };

  const handleDispatchReaction = (emoji: string) => {
    sendReaction(emoji);
  };

  const handleDisconnect = () => {
    disconnectRoom();
    router.push("/together");
  };

  // Filter reactions that are less than 6 seconds old to display animated floaters
  const activeReactions = room.reactions.filter(
    (r) => Date.now() - r.timestamp < 6000
  );

  const activeListeners = room.participants.filter(p => p.isOnline);
  const userHasVoted = room.votes.includes(username || "");

  return (
    <div className="space-y-6 select-none py-4 text-white font-sans max-w-6xl mx-auto px-4 pb-28">
      
      {/* Keyframes injection for floating emoji animations */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(120px) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(100px) scale(1) rotate(-10deg);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0.6) rotate(15deg);
            opacity: 0;
          }
        }
        .reaction-bubble {
          animation: floatUp 4.5s ease-out forwards;
        }
      `}</style>

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-[#ff004f] bg-[#ff004f]/10 border border-[#ff004f]/15 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff004f] animate-ping" />
              KAMAR AKTIF: {room.id}
            </span>
            <span className="text-[8px] font-mono font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-1 rounded-lg uppercase">
              {role === "host" ? "👑 HOST" : "👥 GUEST"}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white truncate max-w-md">{room.name}</h1>
          <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5">
            <Users size={12} className="text-[#ff004f]" />
            <span>{activeListeners.length} Pendengar Online</span>
            <span>•</span>
            <span>Disponsori oleh @{room.hostId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/together?join=${room.id}`);
              alert(`Link kamar disalin! Kirimkan kode "${room.id}" ke teman.`);
            }}
            className="px-4 py-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-zinc-300"
          >
            Undang Teman
          </button>
          
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Keluar Kamar</span>
          </button>
        </div>
      </div>

      {/* MOBILE TAB CONTROLLER */}
      <div className="flex md:hidden items-center border border-white/5 bg-zinc-950/40 backdrop-blur rounded-2xl p-1.5 gap-1 select-none">
        {(["player", "chat", "queue", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white text-black font-black"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            {tab === "player" && "Now Playing"}
            {tab === "chat" && "Live Chat"}
            {tab === "queue" && "Queue"}
            {tab === "settings" && "Room Info"}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT SPLITTER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: NOW PLAYING & REACTION FLOATER (6 Cols) */}
        <div className={`md:col-span-5 space-y-6 ${activeTab !== "player" ? "hidden md:block" : "block"}`}>
          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 flex flex-col justify-between h-full relative overflow-hidden min-h-[420px] backdrop-blur-md">
            
            {/* Ambient Background Aura */}
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 rounded-full bg-[#ff004f] opacity-[0.05] filter blur-3xl pointer-events-none" />

            {/* ARTWORK SHELL WITH ANIMATED REACTIONS */}
            <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-zinc-900 flex items-center justify-center">
              {currentSong ? (
                <Image 
                  src={currentSong.thumbnail} 
                  alt={currentSong.title} 
                  fill 
                  className="object-cover animate-zoom-in"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-600">
                  <Radio size={40} className="animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Aura Kosong</span>
                </div>
              )}

              {/* FLOATING REAL-TIME EMOTE OVERLAYS */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {activeReactions.map((react, idx) => (
                  <div
                    key={react.id}
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: `${15 + (idx * 23) % 70}%`,
                    }}
                    className="reaction-bubble text-3xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter select-none pointer-events-none"
                  >
                    {react.emoji}
                  </div>
                ))}
              </div>

              {/* Live sync badge overlay */}
              {currentSong && isPlaying && (
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md border border-white/5 px-2 py-1 rounded text-[7px] font-black tracking-widest uppercase text-[#ff004f] z-20 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#ff004f] animate-ping" />
                  SYNCED PLAYBACK
                </div>
              )}
            </div>

            {/* SONG INFO BLOCK */}
            <div className="text-center space-y-1.5 mt-4 flex-grow flex flex-col justify-center">
              {currentSong ? (
                <>
                  <h2 className="text-base font-black text-white tracking-tight line-clamp-1">{currentSong.title}</h2>
                  <p className="text-xs text-zinc-400 font-semibold truncate">{currentSong.artist}</p>
                </>
              ) : (
                <p className="text-xs text-zinc-500 italic font-semibold leading-relaxed">
                  Belum ada musik diputar. Cari lagu di Home atau Search untuk mulai syncing bersama!
                </p>
              )}
            </div>

            {/* SYNC PLAYBACK INDICATORS & CONTROLLERS */}
            {currentSong && (
              <div className="space-y-4 mt-4 border-t border-white/5 pt-4">
                {/* Custom media bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-500 font-bold">LIVE STATE</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#ff004f] flex items-center gap-1.5">
                    {isPlaying ? "PLAYING" : "PAUSED"}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {/* Host specific controller */}
                  {role === "host" || room.settings.allowGuestsToControlPlayback ? (
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] text-white flex items-center justify-center shadow-lg hover:shadow-[#ff004f]/25 transition-all active:scale-95 cursor-pointer"
                    >
                      {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                    </button>
                  ) : (
                    <div className="text-center text-[10px] font-semibold text-zinc-500 leading-relaxed bg-zinc-900 border border-white/5 px-4.5 py-2 rounded-xl">
                      🔒 Kontrol dikunci oleh Host. Anda menyelaraskan otomatis.
                    </div>
                  )}

                  {/* Vote Skip Trigger Button */}
                  {room.settings.allowGuestsToVoteSkip && role !== "host" && (
                    <button
                      onClick={voteSkipRoom}
                      className={`px-4.5 py-2 rounded-full text-xs font-black tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                        userHasVoted 
                          ? "bg-[#ff004f] border-[#ff004f] text-white shadow-lg shadow-[#ff004f]/10"
                          : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
                      }`}
                    >
                      <span>Vote Skip</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/30 rounded">
                        {room.votes.length}/{Math.ceil(activeListeners.length * 0.5)}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* REAL-TIME DISPATCH EMOJI PANE */}
            {room.settings.reactionsEnabled && (
              <div className="border-t border-white/5 pt-4 mt-4 space-y-2">
                <span className="block text-[8px] uppercase tracking-widest text-zinc-500 font-black text-center">Dispatch Reaction</span>
                <div className="flex justify-center gap-2.5">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleDispatchReaction(emoji)}
                      className="text-xl p-2 rounded-xl bg-white/5 hover:bg-[#ff004f]/20 hover:scale-125 border border-transparent hover:border-[#ff004f]/10 transition-all cursor-pointer select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MIDDLE COLUMN: LIVE CHAT & DISCUSSIONS (4 Cols) */}
        <div className={`md:col-span-4 space-y-6 ${activeTab !== "chat" ? "hidden md:block" : "block"}`}>
          <div className="p-5 rounded-3xl bg-zinc-950/40 border border-white/5 h-full flex flex-col justify-between min-h-[420px] backdrop-blur-md">
            
            <div className="space-y-3 flex flex-col flex-grow min-h-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] border-b border-white/5 pb-2 flex items-center gap-1.5">
                <MessageSquare size={13} />
                <span>Live Chat Lounge</span>
              </h2>

              {/* Chat Messages Feed container */}
              {room.settings.chatEnabled ? (
                <div className="flex-grow overflow-y-auto space-y-3.5 pr-1.5 scrollbar-none max-h-[290px] min-h-[180px]">
                  {room.chat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600 gap-1 italic text-xs">
                      <MessageSquare size={20} className="stroke-zinc-700" />
                      <span>Belum ada pesan. Sapa teman dengar Anda di sini!</span>
                    </div>
                  ) : (
                    room.chat.map((msg) => {
                      const isMe = msg.senderName.toLowerCase() === username?.toLowerCase();
                      const isMsgHost = msg.senderName.toLowerCase() === room.hostId.toLowerCase();

                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "items-start"}`}
                        >
                          <span className={`text-[8px] font-bold uppercase mb-0.5 px-1 truncate ${
                            isMe 
                              ? "text-[#ff004f]" 
                              : isMsgHost 
                                ? "text-amber-400" 
                                : "text-zinc-500"
                          }`}>
                            {msg.senderName} {isMsgHost && "👑"}
                          </span>
                          <div className={`px-3 py-2 rounded-2xl text-xs font-semibold leading-relaxed break-all ${
                            isMe 
                              ? "bg-[#ff004f] text-white rounded-tr-none shadow-md shadow-[#ff004f]/10" 
                              : "bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-center p-4 text-zinc-500 text-xs italic border border-dashed border-zinc-800 rounded-2xl">
                  Fitur obrolan dinonaktifkan oleh Host.
                </div>
              )}
            </div>

            {/* Message composer input */}
            {room.settings.chatEnabled && (
              <form onSubmit={handleSendChatMessage} className="flex gap-2.5 border-t border-white/5 pt-3 mt-3">
                <input
                  type="text"
                  placeholder="Ketik pesan..."
                  maxLength={120}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#ff004f] transition-all placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#ff004f] hover:text-white border border-white/10 hover:border-[#ff004f] text-zinc-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-zinc-400 disabled:hover:border-white/10"
                >
                  <Send size={12} />
                </button>
              </form>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: SYNCHRONIZED QUEUE & PARTICIPANTS (3 Cols) */}
        <div className={`md:col-span-3 space-y-6 ${activeTab !== "queue" && activeTab !== "settings" ? "hidden md:block" : "block"}`}>
          
          {/* QUEUE CARD PANEL */}
          <div className={`p-5 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-3.5 backdrop-blur-md ${activeTab === "settings" ? "hidden md:block" : "block"}`}>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] border-b border-white/5 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListMusic size={13} />
                <span>Antrean Kamar</span>
              </span>
              <span className="text-[9px] font-mono font-bold text-zinc-400">{room.queue.length} Lagu</span>
            </h2>

            <div className="overflow-y-auto pr-1 scrollbar-none space-y-2.5 max-h-[190px] min-h-[140px]">
              {room.queue.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-zinc-600 italic">
                  Belum ada antrean lagu.
                </div>
              ) : (
                room.queue.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 transition-all gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <Image src={song.thumbnail} alt={song.title} fill className="object-cover" />
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <span className="block text-[11px] font-bold text-white truncate">{song.title}</span>
                        <span className="block text-[9px] text-zinc-500 font-semibold truncate">{song.artist}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {role === "host" ? (
                        <button
                          onClick={() => removeTrackFromRoomQueue(song.id)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase">{song.duration}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick action button to direct to search */}
            {room.settings.allowGuestsToAddSongs || role === "host" ? (
              <Link
                href="/search"
                className="w-full py-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-center block text-zinc-300 transition-colors"
              >
                + Cari & Tambah Lagu
              </Link>
            ) : null}
          </div>

          {/* ROOM SETTINGS & PARTICIPANTS (VISIBLE IN SETTINGS TAB ON MOBILE) */}
          <div className={`p-5 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-4 backdrop-blur-md ${activeTab === "queue" ? "hidden md:block" : "block"}`}>
            
            {/* Participants */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <Users size={12} />
                <span>Daftar Pendengar ({room.participants.length})</span>
              </h3>
              
              <div className="space-y-1.5 overflow-y-auto max-h-[110px] pr-1 scrollbar-none">
                {room.participants.map((person) => (
                  <div key={person.id} className="flex items-center justify-between text-xs py-1">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${person.isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                      {person.name}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
                      {person.role === "host" ? "👑 HOST" : "👥 GUEST"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host settings sliders (Host only) */}
            {role === "host" && (
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Settings size={12} />
                  <span>Pengaturan Kamar</span>
                </h3>

                <div className="space-y-2.5 text-xs font-semibold text-zinc-300">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Izinkan Guest Tambah</span>
                    <input
                      type="checkbox"
                      checked={room.settings.allowGuestsToAddSongs}
                      onChange={(e) => updateSettings({ allowGuestsToAddSongs: e.target.checked })}
                      className="rounded accent-[#ff004f]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Gunakan Vote Skip</span>
                    <input
                      type="checkbox"
                      checked={room.settings.allowGuestsToVoteSkip}
                      onChange={(e) => updateSettings({ allowGuestsToVoteSkip: e.target.checked })}
                      className="rounded accent-[#ff004f]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Guest Bebas Play/Pause</span>
                    <input
                      type="checkbox"
                      checked={room.settings.allowGuestsToControlPlayback}
                      onChange={(e) => updateSettings({ allowGuestsToControlPlayback: e.target.checked })}
                      className="rounded accent-[#ff004f]"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
