"use client";

import { useState } from "react";
import { useRadioStore } from "@/store/useRadioStore";
import { useRouter } from "next/navigation";
import { 
  Sun, Moon, Flame, Wind, Music, Sparkles, Loader2, Play
} from "lucide-react";

interface VibeCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  query: string;
}

const VIBES: VibeCard[] = [
  {
    id: "chill",
    title: "Acoustic Chill",
    description: "Nikmati sore santai dengan alunan akustik & lo-fi hangat.",
    icon: Sun,
    color: "from-amber-500/10 to-orange-500/20 border-amber-500/20 hover:border-amber-400 text-amber-400",
    query: "acoustic chill cafe sunset relax",
  },
  {
    id: "focus",
    title: "Focus Mode",
    description: "Beat lo-fi instrumental konstan untuk menemani belajar & coding.",
    icon: Wind,
    color: "from-teal-500/10 to-emerald-500/20 border-teal-500/20 hover:border-teal-400 text-teal-400",
    query: "lofi study coding focus study beats",
  },
  {
    id: "energy",
    title: "Energi Maksimal",
    description: "Bass menghentak, EDM, & Phonk untuk mendongkrak semangat olahraga.",
    icon: Flame,
    color: "from-red-500/10 to-[#ff004f]/20 border-[#ff004f]/20 hover:border-[#ff004f] text-[#ff004f]",
    query: "gym phonk workout bass boost energetic",
  },
  {
    id: "night",
    title: "Late Night Drive",
    description: "Vaporwave retro, synthwave, & r&b lambat untuk merenung di larut malam.",
    icon: Moon,
    color: "from-indigo-500/10 to-violet-500/20 border-indigo-500/20 hover:border-indigo-400 text-indigo-400",
    query: "synthwave vaporwave late night drive slow r&b",
  },
  {
    id: "indonesian",
    title: "Indo Pop Hits",
    description: "Lagu pop Indonesia terpopuler & viral yang sedang hangat didengar.",
    icon: Music,
    color: "from-cyan-500/10 to-blue-500/20 border-cyan-500/20 hover:border-cyan-400 text-cyan-400",
    query: "pop indonesia viral hits terbaru 2026",
  },
];

export default function AntiMusicFlowSection() {
  const router = useRouter();
  const { startRadio, isGenerating } = useRadioStore();
  const [activeGeneratingId, setActiveGeneratingId] = useState<string | null>(null);

  const handleStartVibeRadio = async (vibe: VibeCard) => {
    setActiveGeneratingId(vibe.id);
    try {
      const session = await startRadio({
        type: "mood",
        id: vibe.id,
        title: vibe.title,
      }, "balanced");

      if (session) {
        // Automatically trigger play and redirect
        useRadioStore.getState().playRadioSession(session);
        router.push(`/radio/${session.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveGeneratingId(null);
    }
  };

  return (
    <div id="antimusic-flow-section" className="space-y-6 scroll-mt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>AntiMusic Mood Stations</span>
            <Sparkles size={18} className="text-[#ff004f]" />
          </h2>
          <p className="text-xs text-zinc-400 font-semibold">
            Pilih getaran/mood Anda dan biarkan algoritme anti-algoritme kami menyusun stasiun radio ideal Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {VIBES.map((vibe) => {
          const Icon = vibe.icon;
          const isCurrentGenerating = activeGeneratingId === vibe.id;

          return (
            <div
              key={vibe.id}
              onClick={() => !isGenerating && handleStartVibeRadio(vibe)}
              className={`group relative overflow-hidden rounded-xl border p-5 bg-zinc-900/40 backdrop-blur-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-[160px] ${vibe.color}`}
            >
              {/* Decorative Background Icon */}
              <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500">
                <Icon size={120} />
              </div>

              <div className="space-y-1.5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                  <Icon size={16} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-[#ff004f] transition-colors">
                  {vibe.title}
                </h3>
                <p className="text-[10px] leading-relaxed text-zinc-400 font-medium line-clamp-2">
                  {vibe.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 relative z-10">
                <span className="text-[9px] font-black tracking-wider uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                  {isCurrentGenerating ? "MENYUSUN STASIUN..." : "MULAI RADIO"}
                </span>

                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#ff004f] group-hover:border-[#ff004f] group-hover:text-white transition-all duration-300 shadow-md">
                  {isCurrentGenerating ? (
                    <Loader2 size={12} className="animate-spin text-[#ff004f]" />
                  ) : (
                    <Play size={10} className="fill-current translate-x-[1px]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
