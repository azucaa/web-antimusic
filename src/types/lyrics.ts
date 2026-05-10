export interface LyricsLine {
  time?: number; // Time offset in seconds
  text: string;
  translation?: string;
}

export interface LyricsResult {
  songId: string;
  provider: "lrclib" | "youtube" | "manual" | "mock";
  synced: boolean;
  lines: LyricsLine[];
}
