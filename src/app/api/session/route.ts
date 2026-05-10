import { NextResponse } from "next/server";
import { ListeningRoom, RoomParticipant, RoomChatMessage, RoomReaction } from "@/types/room";
import { Song } from "@/types/music";

const rooms = new Map<string, ListeningRoom>();

// Clean up stale rooms (no activity for 20 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.updatedAt > 20 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

// GET /api/session - Fetches active room state and refreshes participant heartbeat
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get("roomCode")?.trim().toUpperCase();
  const username = searchParams.get("username")?.trim();

  if (!roomCode) {
    return NextResponse.json({ error: "Room code required" }, { status: 400 });
  }

  const room = rooms.get(roomCode);
  if (!room) {
    return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
  }

  const now = Date.now();

  // Register or refresh participant heartbeat
  if (username) {
    const existing = room.participants.find(
      (p) => p.name.toLowerCase() === username.toLowerCase()
    );
    if (existing) {
      existing.lastSeenAt = now;
      existing.isOnline = true;
    } else {
      const isHost = room.hostId.toLowerCase() === username.toLowerCase();
      const newParticipant: RoomParticipant = {
        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: username,
        role: isHost ? "host" : "guest",
        joinedAt: now,
        lastSeenAt: now,
        isOnline: true,
      };
      room.participants.push(newParticipant);
    }
  }

  // Prune inactive participants (offline after 10s of no heartbeat)
  room.participants = room.participants.map((p) => {
    if (now - p.lastSeenAt > 10000) {
      return { ...p, isOnline: false };
    }
    return p;
  });

  // Keep room updated timestamp alive
  room.updatedAt = now;

  return NextResponse.json(room);
}

// POST /api/session - Controls room mutations (create, sync, chat, reaction, queue, settings, votes)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, action, username } = body;

    const code = roomCode?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Room code required" }, { status: 400 });
    }

    const now = Date.now();

    // ACTION: CREATE
    if (action === "create" || body.isCreate) {
      const roomName = body.roomName || `Room ${code}`;
      const hostName = username?.trim() || "Host";

      const newRoom: ListeningRoom = {
        id: code,
        name: roomName,
        hostId: hostName,
        createdAt: now,
        updatedAt: now,
        isPrivate: false,
        inviteCode: code,
        participants: [
          {
            id: "host-id",
            name: hostName,
            role: "host",
            joinedAt: now,
            lastSeenAt: now,
            isOnline: true,
          },
        ],
        queue: body.initialQueue || [],
        currentTrack: body.currentTrack || null,
        playbackState: {
          status: "stopped",
          positionMs: 0,
          updatedAt: now,
          controlledBy: hostName,
          revision: 0,
        },
        settings: {
          allowGuestsToAddSongs: body.settings?.allowGuestsToAddSongs ?? true,
          allowGuestsToVoteSkip: body.settings?.allowGuestsToVoteSkip ?? true,
          allowGuestsToControlPlayback: body.settings?.allowGuestsToControlPlayback ?? false,
          maxQueueSize: body.settings?.maxQueueSize ?? 50,
          syncToleranceMs: body.settings?.syncToleranceMs ?? 4000,
          chatEnabled: body.settings?.chatEnabled ?? true,
          reactionsEnabled: body.settings?.reactionsEnabled ?? true,
        },
        chat: [],
        reactions: [],
        votes: [],
        queueRevision: 0,
      };

      rooms.set(code, newRoom);
      return NextResponse.json(newRoom);
    }

    // Load active room
    const room = rooms.get(code);
    if (!room) {
      return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
    }

    // Refresh sender presence
    if (username) {
      const existing = room.participants.find((p) => p.name.toLowerCase() === username.toLowerCase());
      if (existing) {
        existing.lastSeenAt = now;
        existing.isOnline = true;
      }
    }

    room.updatedAt = now;

    // ACTION: UPDATE PLAYBACK (Broadcasting host playback states)
    if (action === "sync_playback") {
      const { isPlaying, currentTime, currentSong, queue } = body;
      const targetStatus = isPlaying ? "playing" : "paused";
      
      const statusChanged = room.playbackState.status !== targetStatus;
      const trackChanged = currentSong && (!room.currentTrack || room.currentTrack.id !== currentSong.id);
      const seeked = currentTime !== undefined && Math.abs((room.playbackState.positionMs || 0) - currentTime) > 4.0;

      room.playbackState.status = targetStatus;
      room.playbackState.positionMs = currentTime || 0;
      room.playbackState.updatedAt = now;
      room.playbackState.controlledBy = username || room.hostId;
      
      if (currentSong) {
        room.currentTrack = currentSong;
      }
      
      if (statusChanged || trackChanged || seeked) {
        room.playbackState.revision = (room.playbackState.revision || 0) + 1;
      }

      if (queue) {
        const queueChanged = room.queue.length !== queue.length || room.queue.some((s, idx) => s.id !== queue[idx]?.id);
        if (queueChanged) {
          room.queue = queue;
          room.queueRevision = (room.queueRevision || 0) + 1;
        }
      }
      return NextResponse.json(room);
    }

    // ACTION: CHAT MESSAGE
    if (action === "chat") {
      const { text } = body;
      if (text && text.trim()) {
        const newMessage: RoomChatMessage = {
          id: `msg-${now}-${Math.floor(Math.random() * 1000)}`,
          roomId: code,
          senderId: username || "Guest",
          senderName: username || "Guest",
          text: text.trim(),
          createdAt: now,
        };
        room.chat.push(newMessage);
        if (room.chat.length > 50) {
          room.chat.shift();
        }
      }
      return NextResponse.json(room);
    }

    // ACTION: REACTION EMOJI
    if (action === "reaction") {
      const { emoji } = body;
      if (emoji) {
        const newReaction: RoomReaction = {
          id: `react-${now}-${Math.floor(Math.random() * 1000)}`,
          emoji,
          senderName: username || "Anon",
          timestamp: now,
        };
        room.reactions.push(newReaction);
        if (room.reactions.length > 20) {
          room.reactions.shift();
        }
      }
      return NextResponse.json(room);
    }

    // ACTION: ADD TO QUEUE
    if (action === "add_to_queue") {
      const { song } = body;
      if (song) {
        const exists = room.queue.some((s) => s.id === song.id);
        if (!exists && room.queue.length < room.settings.maxQueueSize) {
          room.queue.push(song);
          room.queueRevision = (room.queueRevision || 0) + 1;
        }
      }
      return NextResponse.json(room);
    }

    // ACTION: REMOVE FROM QUEUE
    if (action === "remove_from_queue") {
      const { videoId } = body;
      if (videoId) {
        const originalLength = room.queue.length;
        room.queue = room.queue.filter((s) => s.id !== videoId);
        if (room.queue.length !== originalLength) {
          room.queueRevision = (room.queueRevision || 0) + 1;
        }
      }
      return NextResponse.json(room);
    }

    // ACTION: REORDER QUEUE
    if (action === "reorder_queue") {
      const { queue } = body;
      if (queue) {
        room.queue = queue;
        room.queueRevision = (room.queueRevision || 0) + 1;
      }
      return NextResponse.json(room);
    }

    // ACTION: VOTE SKIP
    if (action === "vote_skip") {
      if (username) {
        const index = room.votes.indexOf(username);
        if (index > -1) {
          room.votes.splice(index, 1);
        } else {
          room.votes.push(username);
        }

        const activeCount = room.participants.filter((p) => p.isOnline).length;
        const requiredVotes = Math.ceil(activeCount * 0.5);
        if (room.votes.length >= requiredVotes && requiredVotes > 0) {
          room.votes = [];
          room.playbackState.revision = (room.playbackState.revision || 0) + 1;
          return NextResponse.json({ ...room, triggerSkip: true });
        }
      }
      return NextResponse.json(room);
    }

    // ACTION: UPDATE ROOM SETTINGS
    if (action === "update_settings") {
      const { settings } = body;
      if (settings) {
        room.settings = {
          ...room.settings,
          ...settings,
        };
      }
      return NextResponse.json(room);
    }

    // Default: Fallback Host state update
    const { currentSong, isPlaying, currentTime } = body;
    room.currentTrack = currentSong || room.currentTrack;
    room.playbackState.status = isPlaying ? "playing" : "paused";
    room.playbackState.positionMs = currentTime ?? room.playbackState.positionMs;
    room.playbackState.updatedAt = now;

    return NextResponse.json(room);
  } catch (err: any) {
    console.error("Session update error:", err);
    return NextResponse.json({ error: "Server sync fail: " + err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
