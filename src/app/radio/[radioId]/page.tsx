"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRadioStore } from "@/store/useRadioStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useRoomStore } from "@/store/useRoomStore";
import Image from "next/image";
import Link from "next/link";
import { 
  Radio, Sparkles, Compass, User, Disc, Play, Star, Users, Loader2, ArrowLeft, ArrowRight, ShieldCheck, MoreVertical
} from "lucide-react";
import ContextMenu from "@/components/common/ContextMenu";

export default function RadioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const radioId = params.radioId as string;

  const { 
    currentRadioSession, isGenerating, changeRadioMode, 
    saveCurrentRadio, unsaveRadio, savedRadios, playRadioSession
  } = useRadioStore();

  const { currentSong } = usePlayerStore();
  const { createRoom } = useRoomStore();

  const [isSaved, setIsSaved] = useState(false);
  const [activeMode, setActiveMode] = useState<"balanced" | "discovery" | "familiar" | "anti_algorithm">("balanced");

  useEffect(() => {
    // If no active session matches this ID, check if we can fall back to loading from saved list
    if (!currentRadioSession) {
      const match = savedRadios.find(r => r.id === radioId);
      if (match) {
        useRadioStore.setState({
          currentRadioSession: {
            id: match.id,
            seed: match.seed,
            title: match.title,
            tracks: match.tracks,
            createdAt: match.createdAt,
            updatedAt: match.updatedAt,
            mode: match.mode,
          }
        });
      } else {
        router.push("/");
      }
    }
  }, [radioId, currentRadioSession, savedRadios, router]);

  useEffect(() => {
    if (currentRadioSession) {
      setIsSaved(savedRadios.some(r => r.id === currentRadioSession.id));
      setActiveMode(currentRadioSession.mode);
    }
  }, [currentRadioSession, savedRadios]);

  if (!currentRadioSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white gap-3">
        <Loader2 className="animate-spin text-[#ff004f]" size={36} />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Memuat Stasiun Radio...</p>
      </div>
    );
  }

  const handleModeChange = async (mode: typeof activeMode) => {
    setActiveMode(mode);
    await changeRadioMode(mode);
  };

  const handlePlaySession = () => {
    playRadioSession(currentRadioSession);
  };

  const handleToggleSave = () => {
    if (isSaved) {
      unsaveRadio(currentRadioSession.id);
    } else {
      saveCurrentRadio();
    }
  };

  const handleStartTogether = async () => {
    // Host a together room with the radio tracks as queue
    const code = await createRoom(`${currentRadioSession.title} Room`, {
      allowGuestsToAddSongs: true,
      allowGuestsToVoteSkip: true,
      allowGuestsToControlPlayback: false,
    });
    if (code) {
      // Set local queue to radio tracks
      useQueueStore.getState().setQueue(currentRadioSession.tracks, 0);
      router.push(`/together/room/${code}`);
    }
  };

  const seed = currentRadioSession.seed;

  return (
    <div className="space-y-8 select-none py-4 text-white font-sans max-w-5xl mx-auto px-4 pb-24">
      {/* Back button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-2 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Kembali ke Beranda</span>
      </Link>

      {/* RADIO STATIONS HEADER OVERLAY CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-[#0e0e11] to-zinc-950 border border-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-[-40%] left-[-20%] w-80 h-80 rounded-full bg-[#ff004f] opacity-[0.06] filter blur-[100px] pointer-events-none" />
        
        {/* Left Side Info */}
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left min-w-0 flex-1">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-2xl bg-zinc-900">
            {seed.thumbnail ? (
              <Image src={seed.thumbnail} alt={seed.title} fill className="object-cover animate-zoom-in" />
            ) : (
              <div className="w-full h-full bg-[#ff004f]/10 flex items-center justify-center text-[#ff004f]">
                <Radio size={40} className="animate-pulse" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
              <Sparkles size={14} className="text-[#ff004f]" />
              <span className="text-[9px] uppercase tracking-widest font-black text-[#ff004f]/90">
                STASIUN RADIO AKTIF
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
              {currentRadioSession.title}
            </h1>
            <p className="text-xs text-zinc-400 font-semibold max-w-md leading-relaxed line-clamp-2">
              {currentRadioSession.description}
            </p>
          </div>
        </div>

        {/* Right Side Control Buttons */}
        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0 justify-center">
          <button
            onClick={handlePlaySession}
            className="flex items-center gap-2 px-5 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg hover:shadow-[#ff004f]/25 cursor-pointer"
          >
            <Play size={14} fill="white" />
            <span>Putar Stasiun</span>
          </button>

          <button
            onClick={handleToggleSave}
            className={`flex items-center gap-2 px-4.5 py-3 border rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
              isSaved
                ? "bg-amber-400/15 border-amber-400/30 text-amber-400 hover:bg-amber-400/25"
                : "bg-zinc-900 border-white/5 text-zinc-300 hover:border-white/10 hover:text-white"
            }`}
          >
            <Star size={14} className={isSaved ? "fill-amber-400" : ""} />
            <span>{isSaved ? "Tersimpan" : "Simpan"}</span>
          </button>

          <button
            onClick={handleStartTogether}
            className="flex items-center gap-2 px-4.5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer"
          >
            <Users size={14} className="text-[#ff004f]" />
            <span>Siar Bersama</span>
          </button>
        </div>
      </div>

      {/* MAIN BODY LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: SEED SPECIFICATIONS & ALGORITHM SELECTORS */}
        <div className="md:col-span-4 space-y-6">
          {/* Seed Panel */}
          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#ff004f] border-b border-white/5 pb-2">
              Profil Seed Radio
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-500">Tipe Asal:</span>
                <span className="text-white uppercase font-black">{seed.type}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-500">Judul Seed:</span>
                <span className="text-white font-extrabold max-w-[150px] truncate">{seed.title}</span>
              </div>
              {seed.artist && (
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-500">Artis:</span>
                  <span className="text-white font-extrabold max-w-[150px] truncate">{seed.artist}</span>
                </div>
              )}
            </div>
          </div>

          {/* Algorithmic Modes Selectors */}
          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#ff004f] border-b border-white/5 pb-2">
              Algoritme Stasiun
            </h3>
            
            <div className="space-y-3">
              {/* Balanced Selector */}
              <div
                onClick={() => !isGenerating && activeMode !== "balanced" && handleModeChange("balanced")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  activeMode === "balanced"
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 text-white"
                    : "bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase tracking-wider">Balanced</span>
                  <Compass size={12} className={activeMode === "balanced" ? "text-[#ff004f]" : ""} />
                </div>
                <p className="text-[10px] leading-relaxed font-semibold text-zinc-500">Campuran harmonis antara rekomendasi online & riwayat dengar Anda.</p>
              </div>

              {/* Discovery Selector */}
              <div
                onClick={() => !isGenerating && activeMode !== "discovery" && handleModeChange("discovery")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  activeMode === "discovery"
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 text-white"
                    : "bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase tracking-wider">Discovery</span>
                  <Sparkles size={12} className={activeMode === "discovery" ? "text-[#ff004f]" : ""} />
                </div>
                <p className="text-[10px] leading-relaxed font-semibold text-zinc-500">Mengesampingkan sejarah dengar demi mengeksplorasi lagu baru secara acak.</p>
              </div>

              {/* Familiar Selector */}
              <div
                onClick={() => !isGenerating && activeMode !== "familiar" && handleModeChange("familiar")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  activeMode === "familiar"
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 text-white"
                    : "bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase tracking-wider">Familiar</span>
                  <User size={12} className={activeMode === "familiar" ? "text-[#ff004f]" : ""} />
                </div>
                <p className="text-[10px] leading-relaxed font-semibold text-zinc-500">Memprioritaskan lagu-lagu sejenis yang sudah tersimpan di pustaka lokal Anda.</p>
              </div>

              {/* Anti-Algorithm Selector */}
              <div
                onClick={() => !isGenerating && activeMode !== "anti_algorithm" && handleModeChange("anti_algorithm")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  activeMode === "anti_algorithm"
                    ? "bg-[#ff004f]/5 border-[#ff004f]/20 text-white"
                    : "bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase tracking-wider">Anti-Algorithm</span>
                  <Disc size={12} className={activeMode === "anti_algorithm" ? "text-[#ff004f]" : ""} />
                </div>
                <p className="text-[10px] leading-relaxed font-semibold text-zinc-500">Tanpa rekomendasi AI internet. Murni mengambil daftar riwayat putar lokal Anda.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GENERATED TRACKLIST */}
        <div className="md:col-span-8 space-y-4 relative">
          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 rounded-3xl z-20 flex flex-col items-center justify-center gap-3.5 backdrop-blur-sm">
              <Loader2 className="animate-spin text-[#ff004f]" size={36} />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Merajut Komposisi Rekomendasi...</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-zinc-950/40 border border-white/5 min-h-[400px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Rekomendasi Tracklist ({currentRadioSession.tracks.length})</span>
              <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/10 px-2 py-0.5 rounded-md">DEDUPLICATED</span>
            </div>

            <div className="space-y-3">
              {currentRadioSession.tracks.map((song, index) => {
                const isActivePlay = currentSong?.id === song.id;

                return (
                  <ContextMenu key={`${song.id}-${index}`} song={song} className="w-full">
                    <div
                      onClick={() => handlePlaySession()}
                      className={`flex items-center justify-between p-2.5 rounded-xl border border-white/5 transition-all group cursor-pointer ${
                        isActivePlay 
                          ? "bg-[#ff004f]/5 border-[#ff004f]/20" 
                          : "bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className={`text-xs font-mono font-extrabold w-5 text-center shrink-0 ${isActivePlay ? "text-[#ff004f]" : "text-zinc-500 group-hover:text-white"}`}>
                          {isActivePlay ? "▶" : String(index + 1).padStart(2, "0")}
                        </span>
                        
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-900">
                          <Image src={song.thumbnail} alt={song.title} fill className="object-cover" />
                        </div>

                        <div className="truncate min-w-0 flex-1">
                          <h4 className={`text-xs font-extrabold truncate ${isActivePlay ? "text-[#ff004f]" : "text-white group-hover:text-[#ff004f]"}`}>
                            {song.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-semibold">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">{song.duration}</span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ContextMenu song={song} triggerType="click" />
                        </div>
                      </div>
                    </div>
                  </ContextMenu>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
