import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/room/[roomId] - Get room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    // Verify user is a participant
    const match = await prisma.match.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Not authorized for this room" }, { status: 403 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        matches: {
          include: {
            user: true,
          },
        },
        checklist: {
          orderBy: {
            order: "asc",
          },
        },
        recap: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/room/[roomId] - Update room (start, pause, resume, end)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { action } = body;

    // Verify user is a participant
    const match = await prisma.match.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Not authorized for this room" }, { status: 403 });
    }

    let updatedRoom;

    switch (action) {
      case "start":
        updatedRoom = await prisma.room.update({
          where: { id: roomId },
          data: {
            status: "ACTIVE",
            startAt: new Date(),
            endAt: new Date(Date.now() + 25 * 60 * 1000), // 25 minutes from now
          },
        });

        // Update matches to IN_SESSION
        await prisma.match.updateMany({
          where: { roomId },
          data: { status: "IN_SESSION" },
        });
        break;

      case "pause":
        updatedRoom = await prisma.room.update({
          where: { id: roomId },
          data: {
            status: "PAUSED",
            pausedAt: new Date(),
          },
        });
        break;

      case "resume":
        const room = await prisma.room.findUnique({
          where: { id: roomId },
        });

        if (!room || !room.pausedAt || !room.endAt) {
          return NextResponse.json({ error: "Invalid room state" }, { status: 400 });
        }

        const pauseDuration = Date.now() - room.pausedAt.getTime();
        const newEndAt = new Date(room.endAt.getTime() + pauseDuration);

        updatedRoom = await prisma.room.update({
          where: { id: roomId },
          data: {
            status: "ACTIVE",
            endAt: newEndAt,
            pauseDuration: room.pauseDuration + Math.floor(pauseDuration / 1000),
            pausedAt: null,
          },
        });
        break;

      case "end":
        updatedRoom = await prisma.room.update({
          where: { id: roomId },
          data: {
            status: "COMPLETED",
          },
        });

        // Update matches to COMPLETED
        await prisma.match.updateMany({
          where: { roomId },
          data: { status: "COMPLETED" },
        });

        // Update streaks
        await updateUserStreaks(roomId);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateUserStreaks(roomId: string) {
  const matches = await prisma.match.findMany({
    where: { roomId },
    include: { user: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const match of matches) {
    const streak = await prisma.streak.upsert({
      where: {
        userId_date: {
          userId: match.userId,
          date: today,
        },
      },
      update: {
        sessionsCompleted: {
          increment: 1,
        },
      },
      create: {
        userId: match.userId,
        date: today,
        sessionsCompleted: 1,
      },
    });

    // Update user's current streak count
    await updateCurrentStreak(match.userId);
  }
}

async function updateCurrentStreak(userId: string) {
  const streaks = await prisma.streak.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 365, // Check last year
  });

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < streaks.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    const streakDate = new Date(streaks[i].date);
    streakDate.setHours(0, 0, 0, 0);

    if (streakDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streakCount: currentStreak },
  });
}
