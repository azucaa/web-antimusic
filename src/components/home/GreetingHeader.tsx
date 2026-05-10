"use client";

import { useEffect, useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { Music2, Radio, Sparkles, Users } from "lucide-react";
import Link from "next/link";

export default function GreetingHeader() {
  const [greeting, setGreeting] = useState("Selamat Datang");
  const { username, isConnected, roomCode } = useRoomStore();

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) {
      setGreeting("Selamat Pagi");
    } else if (hours >= 11 && hours < 15) {
      setGreeting("Selamat Siang");
    } else if (hours >= 15 && hours < 18) {
      setGreeting("Selamat Sore");
    } else {
      setGreeting("Selamat Malam");
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-[#121214] to-zinc-900 border border-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 select-none shadow-xl">
      {/* Background soft ambient glowing circles */}
      <div className="absolute top-[-50%] left-[-20%] w-80 h-80 rounded-full bg-[#ff004f] opacity-[0.08] filter blur-[120px] pointer-events-none animate-breathe" />
      <div className="absolute bottom-[-50%] right-[-10%] w-80 h-80 rounded-full bg-violet-600 opacity-[0.08] filter blur-[120px] pointer-events-none" />

      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#ff004f] animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-black text-[#ff004f]/90">
            PERSONALIZED FLOW
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {greeting}
          {username ? <span className="text-[#ff004f]">, {username}</span> : "!"}
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-lg leading-relaxed">
          Stasiun audio mandiri premium tanpa batasan. Cari lagu, mulai stasiun radio cerdas, atau undang teman untuk mendengarkan bersama secara real-time.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
        {isConnected ? (
          <Link
            href={`/together/room/${roomCode}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ff004f] text-white hover:bg-[#ff004f]/90 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg hover:shadow-[#ff004f]/20 cursor-pointer"
          >
            <Users size={14} className="animate-pulse" />
            <span>Kamar Aktif ({roomCode})</span>
          </Link>
        ) : (
          <Link
            href="/together"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 hover:border-white/10 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer"
          >
            <Users size={14} className="text-[#ff004f]" />
            <span>Mulai Room</span>
          </Link>
        )}

        <button
          onClick={() => {
            const el = document.getElementById("antimusic-flow-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg"
        >
          <Radio size={14} className="text-[#ff004f]" />
          <span>Vibe Flow</span>
        </button>
      </div>
    </div>
  );
}
