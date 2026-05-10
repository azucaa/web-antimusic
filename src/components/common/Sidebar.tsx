"use client";

import Link from "next/link";
import { SafeImage as Image } from "./SafeImage";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Search, Users, Library, BarChart3, Settings, ShieldAlert, Heart, Disc, User } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useRoomStore } from "@/store/useRoomStore";
import { ArtistDetailSheet, AlbumDetailSheet } from "../search/DetailSheets";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Your Library", href: "/library", icon: Library },
  { label: "Dengar Bersama", href: "/together", icon: Users },
  { label: "Listening Stats", href: "/stats", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { privateSession, antiAlgorithmMode } = useSettingsStore();
  const { savedArtists, savedAlbums } = useLibraryStore();
  const { isConnected, room } = useRoomStore();

  const [activeArtistId, setActiveArtistId] = useState<string | null>(null);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#030303] border-r border-white/5 p-4 select-none z-10 font-sans">
        {/* Brand Logo - Premium YouTube Music / Cyber Aesthetic */}
        <div className="mb-8 px-2 flex flex-col gap-1">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff004f] to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-[#ff004f]/25 group-hover:scale-105 transition-all duration-300">
              A
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-wide group-hover:text-[#ff004f] transition-colors">
                AntiMusic
              </span>
              <span className="block text-[9px] text-[#ff004f] font-black tracking-widest uppercase">
                SOVEREIGN FLOW
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 shrink-0 mb-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isTogether = item.label === "Dengar Bersama";
            const showLiveDot = isTogether && isConnected && room;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-300 group text-xs font-bold relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-[#ff004f]/15 to-[#ff004f]/2 text-white border-l-4 border-[#ff004f] pl-3 shadow-[0_4px_24px_rgba(255,0,79,0.12)]"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 hover:translate-x-1"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-all duration-300 group-hover:scale-110 ${
                    isActive ? "text-[#ff004f] drop-shadow-[0_0_8px_#ff004f]" : "text-muted-foreground group-hover:text-white"
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {showLiveDot && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 border border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Saved Items - Library Pinned Style */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-900 pt-4">
          <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>Pinned Creators</span>
            <Heart size={10} className="text-[#ff004f]" fill="currentColor" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-neutral-900">
            {/* SAVED ARTISTS */}
            {savedArtists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => setActiveArtistId(artist.id)}
                className="w-full text-left flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-800">
                  <Image src={artist.thumbnail} alt={artist.title} fill className="object-cover" />
                </div>
                <div className="truncate flex-1">
                  <span className="block text-xs font-bold text-white group-hover:text-[#ff004f] truncate transition-colors">
                    {artist.title}
                  </span>
                  <span className="block text-[9px] text-muted-foreground flex items-center gap-1">
                    <User size={8} /> Artist
                  </span>
                </div>
              </button>
            ))}

            {/* SAVED ALBUMS */}
            {savedAlbums.map((album) => (
              <button
                key={album.id}
                onClick={() => setActiveAlbumId(album.id)}
                className="w-full text-left flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer"
              >
                <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0 border border-neutral-800">
                  <Image src={album.thumbnail} alt={album.title} fill className="object-cover" />
                </div>
                <div className="truncate flex-1">
                  <span className="block text-xs font-bold text-white group-hover:text-[#ff004f] truncate transition-colors">
                    {album.title}
                  </span>
                  <span className="block text-[9px] text-muted-foreground flex items-center gap-1">
                    <Disc size={8} /> Album
                  </span>
                </div>
              </button>
            ))}

            {savedArtists.length === 0 && savedAlbums.length === 0 && (
              <div className="text-center py-6 text-[10px] text-muted-foreground/60 italic leading-relaxed px-2">
                No pinned artists or albums. Follow or save some creators while searching!
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status Panel */}
        <div className="mt-auto flex flex-col gap-1.5 p-3 rounded-xl bg-[#0c0c0e] border border-neutral-800 shrink-0">
          {privateSession && (
            <div className="flex items-center gap-1.5 text-amber-500 text-[10px]">
              <ShieldAlert size={12} className="shrink-0" />
              <span className="font-semibold uppercase tracking-wider">Private Mode Active</span>
            </div>
          )}
          {antiAlgorithmMode && (
            <div className="flex items-center gap-1.5 text-[#ff004f] text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff004f] animate-ping" />
              <span className="font-semibold uppercase tracking-wider text-[#ff004f]">Sovereignty Active</span>
            </div>
          )}
        </div>
      </aside>

      {/* Detail Overlay Sheet Modals */}
      {activeArtistId && (
        <ArtistDetailSheet id={activeArtistId} onClose={() => setActiveArtistId(null)} />
      )}
      {activeAlbumId && (
        <AlbumDetailSheet id={activeAlbumId} onClose={() => setActiveAlbumId(null)} />
      )}
    </>
  );
}
