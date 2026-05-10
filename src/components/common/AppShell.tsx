"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNavbar from "./BottomNavbar";
import MiniPlayer from "../player/MiniPlayer";
import YTPlayerManager from "./YTPlayerManager";
import YTPlayerSyncManager from "./YTPlayerSyncManager";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUIStore } from "@/store/useUIStore";
import { AlbumDetailSheet, ArtistDetailSheet, PlaylistDetailSheet } from "@/components/search/DetailSheets";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { theme } = useSettingsStore();
  const { 
    selectedAlbumId, selectedArtistId, selectedPlaylistId,
    setSelectedAlbumId, setSelectedArtistId, setSelectedPlaylistId
  } = useUIStore();

  return (
    <div className={`min-h-screen text-foreground select-none relative ${theme === "light" ? "bg-purple-50 text-slate-900" : ""}`}>
      {/* 1. YouTube hidden player instance controller */}
      <YTPlayerManager />
      <YTPlayerSyncManager />

      {/* 2. Sidebar Navigation (Visible on Desktop) */}
      <Sidebar />

      {/* 3. Main Content Scroll Area */}
      <main className="min-h-screen md:pl-64 pb-36 md:pb-24">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* 4. Interactive Music Player Bar */}
      <MiniPlayer />

      {/* 5. Bottom Navigation Bar (Visible on Mobile) */}
      <BottomNavbar />

      {/* 6. Global Detail Sheets Modals */}
      {selectedAlbumId && (
        <AlbumDetailSheet id={selectedAlbumId} onClose={() => setSelectedAlbumId(null)} />
      )}
      {selectedArtistId && (
        <ArtistDetailSheet id={selectedArtistId} onClose={() => setSelectedArtistId(null)} />
      )}
      {selectedPlaylistId && (
        <PlaylistDetailSheet id={selectedPlaylistId} onClose={() => setSelectedPlaylistId(null)} />
      )}
    </div>
  );
}
