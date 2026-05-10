"use client";

import { useEffect, useState } from "react";
import { SafeImage as Image } from "@/components/common/SafeImage";
import Link from "next/link";
import { useLibraryStore } from "@/store/useLibraryStore";
import { 
  BarChart3, Disc, Music, User, TrendingUp, Trophy, 
  Sparkles, Calendar, HelpCircle, ArrowRight
} from "lucide-react";

interface AggregatedStat {
  name: string;
  count: number;
  thumbnail?: string;
}

export default function StatsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { history } = useLibraryStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-purple-400">
        <Disc size={40} className="animate-spin text-purple-600" />
      </div>
    );
  }

  // Calculate Metrics on-the-fly
  const totalPlays = history.length;

  const uniqueSongsSet = new Set(history.map(item => item.song.id));
  const uniqueSongsCount = uniqueSongsSet.size;

  const uniqueArtistsSet = new Set(history.map(item => item.song.artist));
  const uniqueArtistsCount = uniqueArtistsSet.size;

  // Compute Top Artists frequencies
  const artistFreq: Record<string, { count: number; thumbnail?: string }> = {};
  history.forEach(item => {
    const artist = item.song.artist;
    if (!artistFreq[artist]) {
      artistFreq[artist] = { count: 0, thumbnail: item.song.thumbnail };
    }
    artistFreq[artist].count++;
  });

  const sortedArtists: AggregatedStat[] = Object.keys(artistFreq)
    .map(name => ({ name, count: artistFreq[name].count, thumbnail: artistFreq[name].thumbnail }))
    .sort((a, b) => b.count - a.count);

  // Compute Top Songs frequencies
  const songFreq: Record<string, { count: number; song: any }> = {};
  history.forEach(item => {
    const songId = item.song.id;
    if (!songFreq[songId]) {
      songFreq[songId] = { count: 0, song: item.song };
    }
    songFreq[songId].count++;
  });

  const sortedSongs = Object.keys(songFreq)
    .map(id => ({ id, count: songFreq[id].count, song: songFreq[id].song }))
    .sort((a, b) => b.count - a.count);

  const topArtist = sortedArtists[0] || null;
  const topSong = sortedSongs[0]?.song || null;

  // Compute listener persona/archetype based on statistics
  const getListenerPersona = () => {
    if (totalPlays === 0) return "The Silent Observer";
    if (totalPlays > 50 && uniqueArtistsCount < 3) return "The Loyal Devotee";
    if (uniqueArtistsCount > 20) return "The Acoustic Wanderer";
    return "Focus Code Architect";
  };

  const getPersonaDesc = () => {
    const persona = getListenerPersona();
    if (persona === "The Loyal Devotee") return "You find comfort in loops and repetition, exploring deep catalog niches intensely.";
    if (persona === "The Acoustic Wanderer") return "A boundless explorer. You rarely stay in one sub-genre, finding inspiration in novelty.";
    return "A deliberate listener. You use clean instrumental beats and focus acoustics to build premium code spaces.";
  };

  return (
    <div className="space-y-10 py-4 select-none max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-purple-950/20 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="text-purple-400" size={24} />
            <span>Listening Stats</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Private on-device metrics aggregated from local playback history.</p>
        </div>
      </div>

      {totalPlays === 0 ? (
        /* SKELETON PREVIEW FOR EMPTY STATS */
        <div className="p-8 rounded-3xl bg-[#141029]/30 border border-purple-900/10 text-center max-w-md mx-auto space-y-4 py-12">
          <div className="w-16 h-16 rounded-full bg-purple-950/20 border border-purple-900/25 flex items-center justify-center mx-auto">
            <Trophy size={28} className="text-purple-500/40" />
          </div>
          <h3 className="font-extrabold text-sm text-white">Metrics are building</h3>
          <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-xs mx-auto">
            Your listener profile and recap summaries are generated automatically as you play songs. Stream some tracks to unlock metrics!
          </p>
          <Link
            href="/search"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg cursor-pointer inline-flex items-center gap-1.5 select-none"
          >
            Stream Songs
            <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* A. SUMMARY NUMBERS PANEL */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Streams", val: totalPlays, desc: "plays registered", color: "text-purple-400", icon: TrendingUp },
              { label: "Unique Songs", val: uniqueSongsCount, desc: "different tracks", color: "text-cyan-400", icon: Music },
              { label: "Unique Artists", val: uniqueArtistsCount, desc: "different creators", color: "text-pink-400", icon: User },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-[#141029]/30 border border-purple-900/10 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between text-muted-foreground/50">
                    <span className="text-[10px] uppercase font-black tracking-widest">{stat.label}</span>
                    <Icon size={14} className={stat.color} />
                  </div>
                  <div className={`text-2xl md:text-3xl font-extrabold ${stat.color} font-mono`}>
                    {stat.val}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">{stat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* B. PREMIUM RECAP CARD */}
          <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-tr from-purple-950/30 via-[#16122d]/40 to-cyan-950/20 border border-purple-900/15 overflow-hidden shadow-2xl animate-pulse-glow">
            <div className="absolute right-0 top-0 w-48 h-48 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="space-y-4 max-w-md text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/65 border border-purple-800/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider shadow-inner">
                  <Trophy size={10} className="text-purple-400" />
                  <span>My Listening Recap</span>
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">
                  Persona: <span className="text-purple-400">{getListenerPersona()}</span>
                </h2>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  {getPersonaDesc()}
                </p>
              </div>

              {/* Showcase items */}
              <div className="flex flex-col gap-3 w-full md:max-w-[320px] bg-black/40 border border-purple-950/20 p-4 rounded-2xl shadow-inner">
                {topArtist && (
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-purple-900/20">
                      {topArtist.thumbnail ? (
                        <Image src={topArtist.thumbnail} alt={topArtist.name} fill className="object-cover" />
                      ) : (
                        <User className="m-auto text-purple-400" size={16} />
                      )}
                    </div>
                    <div className="truncate">
                      <span className="text-[9px] uppercase tracking-wider font-black text-purple-400 block">Top Artist</span>
                      <span className="text-xs font-bold text-white block truncate">{topArtist.name}</span>
                    </div>
                    <span className="text-xs text-purple-400 font-bold ml-auto shrink-0">{topArtist.count} plays</span>
                  </div>
                )}

                {topSong && (
                  <div className="flex items-center gap-3 border-t border-purple-950/20 pt-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-purple-900/20">
                      <Image src={topSong.thumbnail} alt={topSong.title} fill className="object-cover" />
                    </div>
                    <div className="truncate">
                      <span className="text-[9px] uppercase tracking-wider font-black text-cyan-400 block">Top Song</span>
                      <span className="text-xs font-bold text-white block truncate">{topSong.title}</span>
                    </div>
                    <span className="text-xs text-cyan-400 font-bold ml-auto shrink-0">{sortedSongs[0]?.count} plays</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* C. TOP CHARTS GRIDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Artists Frequencies */}
            <div className="p-5 rounded-3xl bg-[#141029]/20 border border-purple-900/10 space-y-4 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5 pb-2 border-b border-purple-950/15">
                <User size={12} />
                <span>Top Artists</span>
              </h3>
              <div className="space-y-3">
                {sortedArtists.slice(0, 5).map((artist, idx) => {
                  const maxCount = sortedArtists[0]?.count || 1;
                  const barWidth = (artist.count / maxCount) * 100;
                  return (
                    <div key={artist.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[70%]">{idx + 1}. {artist.name}</span>
                        <span className="text-muted-foreground font-semibold">{artist.count} streams</span>
                      </div>
                      {/* Custom bar */}
                      <div className="w-full h-1.5 bg-purple-950/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Songs Frequencies */}
            <div className="p-5 rounded-3xl bg-[#141029]/20 border border-purple-900/10 space-y-4 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5 pb-2 border-b border-purple-950/15">
                <Music size={12} />
                <span>Top Tracks</span>
              </h3>
              <div className="space-y-3">
                {sortedSongs.slice(0, 5).map((item, idx) => {
                  const maxCount = sortedSongs[0]?.count || 1;
                  const barWidth = (item.count / maxCount) * 100;
                  return (
                    <div key={item.song.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[70%]">{idx + 1}. {item.song.title}</span>
                        <span className="text-muted-foreground font-semibold">{item.count} streams</span>
                      </div>
                      {/* Custom bar */}
                      <div className="w-full h-1.5 bg-purple-950/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
