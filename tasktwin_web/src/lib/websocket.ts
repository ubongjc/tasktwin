import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify token with Clerk
      // Store user info in socket
      socket.data.userId = socket.handshake.auth.userId;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.data.userId}`);

    // Handle match queue join
    socket.on("match:join", async (data) => {
      try {
        socket.join("match:queue");

        // Create queue entry
        const queueEntry = await prisma.matchQueue.create({
          data: {
            userId: socket.data.userId,
            topic: data.topic,
            intent: data.intent,
            preferences: data.preferences || {},
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        socket.emit("match:joined", { queueId: queueEntry.id });

        // Trigger matching algorithm
        setTimeout(() => findMatch(socket.data.userId), 2000);
      } catch (error) {
        socket.emit("error", { message: "Failed to join queue" });
      }
    });

    // Handle match queue leave
    socket.on("match:leave", async () => {
      try {
        await prisma.matchQueue.deleteMany({
          where: { userId: socket.data.userId },
        });
        socket.leave("match:queue");
        socket.emit("match:left");
      } catch (error) {
        socket.emit("error", { message: "Failed to leave queue" });
      }
    });

    // Handle room join
    socket.on("room:join", async (data) => {
      const { roomId } = data;

      // Verify user is participant
      const match = await prisma.match.findUnique({
        where: {
          userId_roomId: {
            userId: socket.data.userId,
            roomId,
          },
        },
      });

      if (!match) {
        return socket.emit("error", { message: "Not authorized for this room" });
      }

      socket.join(`room:${roomId}`);

      // Notify room of new participant
      io?.to(`room:${roomId}`).emit("room:participant:joined", {
        userId: socket.data.userId,
      });
    });

    // Handle room actions
    socket.on("room:action", async (data) => {
      const { roomId, action } = data;

      try {
        const room = await prisma.room.update({
          where: { id: roomId },
          data: getActionUpdate(action),
        });

        io?.to(`room:${roomId}`).emit("room:updated", { room, action });
      } catch (error) {
        socket.emit("error", { message: "Failed to perform action" });
      }
    });

    // Handle checklist updates
    socket.on("checklist:update", async (data) => {
      const { roomId, itemId, completed } = data;

      try {
        const item = await prisma.checklistItem.update({
          where: { id: itemId },
          data: { completed },
        });

        io?.to(`room:${roomId}`).emit("checklist:item:updated", { item });
      } catch (error) {
        socket.emit("error", { message: "Failed to update checklist" });
      }
    });

    // Handle recap creation
    socket.on("recap:create", async (data) => {
      const { roomId, text } = data;

      try {
        const matches = await prisma.match.findMany({
          where: { roomId },
        });

        const partner = matches.find((m) => m.userId !== socket.data.userId);

        const recap = await prisma.recap.create({
          data: {
            roomId,
            text,
            user1Id: socket.data.userId,
            user2Id: partner?.userId,
            user1Approved: true,
          },
        });

        io?.to(`room:${roomId}`).emit("recap:created", { recap });
      } catch (error) {
        socket.emit("error", { message: "Failed to create recap" });
      }
    });

    // Handle recap approval
    socket.on("recap:approve", async (data) => {
      const { recapId } = data;

      try {
        const recap = await prisma.recap.findUnique({
          where: { id: recapId },
        });

        if (!recap) {
          return socket.emit("error", { message: "Recap not found" });
        }

        const isUser1 = recap.user1Id === socket.data.userId;
        const updatedRecap = await prisma.recap.update({
          where: { id: recapId },
          data: {
            ...(isUser1 ? { user1Approved: true } : { user2Approved: true }),
            ...((!isUser1 && recap.user1Approved) || (isUser1 && recap.user2Approved)
              ? { finalizedAt: new Date() }
              : {}),
          },
        });

        io?.to(`room:${recap.roomId}`).emit("recap:approved", {
          recap: updatedRecap,
          userId: socket.data.userId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to approve recap" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}

// Matching algorithm
async function findMatch(userId: string) {
  try {
    // Get user's queue entry
    const userEntry = await prisma.matchQueue.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!userEntry) return;

    // Find potential matches
    const potentialMatches = await prisma.matchQueue.findMany({
      where: {
        userId: { not: userId },
        expiresAt: { gt: new Date() },
      },
    });

    if (potentialMatches.length === 0) {
      // No matches available, check again in 5 seconds
      setTimeout(() => findMatch(userId), 5000);
      return;
    }

    // Score matches
    const scoredMatches = potentialMatches.map((match) => ({
      match,
      score: calculateMatchScore(userEntry, match),
    }));

    // Sort by score
    scoredMatches.sort((a, b) => b.score - a.score);

    // Get best match
    const bestMatch = scoredMatches[0];

    if (bestMatch.score < 0.3) {
      // No good matches, wait
      setTimeout(() => findMatch(userId), 5000);
      return;
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        topic: userEntry.topic,
        status: "WAITING",
        durationMinutes: 25,
      },
    });

    // Create matches
    await Promise.all([
      prisma.match.create({
        data: {
          userId,
          roomId: room.id,
          status: "MATCHED",
        },
      }),
      prisma.match.create({
        data: {
          userId: bestMatch.match.userId,
          roomId: room.id,
          status: "MATCHED",
        },
      }),
    ]);

    // Delete queue entries
    await prisma.matchQueue.deleteMany({
      where: {
        id: { in: [userEntry.id, bestMatch.match.id] },
      },
    });

    // Notify both users
    io?.to(`user:${userId}`).emit("match:found", {
      roomId: room.id,
      partnerId: bestMatch.match.userId,
    });

    io?.to(`user:${bestMatch.match.userId}`).emit("match:found", {
      roomId: room.id,
      partnerId: userId,
    });
  } catch (error) {
    console.error("Error in findMatch:", error);
  }
}

function calculateMatchScore(user1: any, user2: any): number {
  let score = 0;

  // Topic similarity (40%)
  if (user1.topic.toLowerCase() === user2.topic.toLowerCase()) {
    score += 0.4;
  } else if (
    user1.topic.toLowerCase().includes(user2.topic.toLowerCase()) ||
    user2.topic.toLowerCase().includes(user1.topic.toLowerCase())
  ) {
    score += 0.2;
  }

  // Intent alignment (40%)
  const user1Intents = new Set(user1.intent);
  const user2Intents = new Set(user2.intent);
  const commonIntents = [...user1Intents].filter((i) => user2Intents.has(i));
  const intentOverlap = commonIntents.length / Math.max(user1Intents.size, user2Intents.size);
  score += 0.4 * intentOverlap;

  // Preference compatibility (20%)
  if (user1.preferences && user2.preferences) {
    const prefs1 = user1.preferences as Record<string, any>;
    const prefs2 = user2.preferences as Record<string, any>;

    let prefMatches = 0;
    let totalPrefs = 0;

    for (const key in prefs1) {
      if (key in prefs2) {
        totalPrefs++;
        if (prefs1[key] === prefs2[key]) {
          prefMatches++;
        }
      }
    }

    if (totalPrefs > 0) {
      score += 0.2 * (prefMatches / totalPrefs);
    }
  }

  return score;
}

function getActionUpdate(action: string) {
  switch (action) {
    case "start":
      return {
        status: "ACTIVE" as const,
        startAt: new Date(),
        endAt: new Date(Date.now() + 25 * 60 * 1000),
      };
    case "pause":
      return {
        status: "PAUSED" as const,
        pausedAt: new Date(),
      };
    case "end":
      return {
        status: "COMPLETED" as const,
      };
    default:
      return {};
  }
}

export function getIO(): SocketIOServer | null {
  return io;
}
