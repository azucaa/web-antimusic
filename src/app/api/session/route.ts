import { NextResponse } from "next/server";

interface Participant {
  username: string;
  lastSeen: number;
}

interface RoomState {
  roomCode: string;
  currentSong: any | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  hostUsername?: string;
  participants?: Participant[];
}

const sessions = new Map<string, RoomState>();

// Periodically clean up stale sessions (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [code, state] of sessions.entries()) {
    if (now - state.lastUpdated > 10 * 60 * 1000) {
      sessions.delete(code);
    }
  }
}, 5 * 60 * 1000);

// GET /api/session - Retrieves a session state and registers/updates guest participant heartbeat
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get("roomCode")?.trim().toUpperCase();
  const username = searchParams.get("username")?.trim();

  if (!roomCode) {
    return NextResponse.json({ error: "Room code required" }, { status: 400 });
  }

  const room = sessions.get(roomCode);
  if (!room) {
    return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
  }

  const now = Date.now();
  if (!room.participants) {
    room.participants = [];
  }

  // If a username is querying the room, register/refresh them as active participant
  if (username) {
    const existing = room.participants.find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );
    if (existing) {
      existing.lastSeen = now;
    } else {
      room.participants.push({ username, lastSeen: now });
    }
  }

  // Automatically clean up stale participants (not seen in the last 10 seconds)
  room.participants = room.participants.filter((p) => now - p.lastSeen < 10000);

  // Keep session alive while clients are active
  room.lastUpdated = now;

  return NextResponse.json(room);
}

// POST /api/session - Updates or creates a session state and host heartbeat
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, currentSong, isPlaying, currentTime, isCreate, username } = body;

    const code = roomCode?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Room code required" }, { status: 400 });
    }

    const now = Date.now();

    if (isCreate) {
      // Create room with initial state and set host
      const hostName = username?.trim() || "Host";
      const newRoom: RoomState = {
        roomCode: code,
        currentSong: null,
        isPlaying: false,
        currentTime: 0,
        lastUpdated: now,
        hostUsername: hostName,
        participants: [{ username: hostName, lastSeen: now }],
      };
      sessions.set(code, newRoom);
      return NextResponse.json(newRoom);
    }

    // Update existing room state
    const room = sessions.get(code);
    if (!room) {
      // If room is missing, auto-create it
      const hostName = username?.trim() || "Host";
      const autoRoom: RoomState = {
        roomCode: code,
        currentSong: currentSong || null,
        isPlaying: isPlaying || false,
        currentTime: currentTime || 0,
        lastUpdated: now,
        hostUsername: hostName,
        participants: [{ username: hostName, lastSeen: now }],
      };
      sessions.set(code, autoRoom);
      return NextResponse.json(autoRoom);
    }

    room.currentSong = currentSong || null;
    room.isPlaying = isPlaying ?? false;
    room.currentTime = currentTime || 0;
    room.lastUpdated = now;

    // Refresh Host heartbeat in the participants list
    if (username) {
      if (!room.participants) room.participants = [];
      const existing = room.participants.find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      );
      if (existing) {
        existing.lastSeen = now;
      } else {
        room.participants.push({ username: username.trim(), lastSeen: now });
      }
    }

    // Filter out stale participants (> 10s)
    if (room.participants) {
      room.participants = room.participants.filter((p) => now - p.lastSeen < 10000);
    }

    return NextResponse.json(room);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid body data: " + err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
