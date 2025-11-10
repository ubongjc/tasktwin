import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/streaks - Get user's streak data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Get user's current streak
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get streak history
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const streaks = await prisma.streak.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Calculate best streak
    const allStreaks = await prisma.streak.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    let bestStreak = 0;
    let currentStreakCount = 0;
    let previousDate: Date | null = null;

    for (const streak of allStreaks) {
      const streakDate = new Date(streak.date);
      streakDate.setHours(0, 0, 0, 0);

      if (previousDate === null) {
        currentStreakCount = 1;
      } else {
        const dayDiff = Math.floor(
          (previousDate.getTime() - streakDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          currentStreakCount++;
        } else {
          bestStreak = Math.max(bestStreak, currentStreakCount);
          currentStreakCount = 1;
        }
      }

      previousDate = streakDate;
    }

    bestStreak = Math.max(bestStreak, currentStreakCount);

    return NextResponse.json({
      current: user.streakCount,
      best: bestStreak,
      history: streaks.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        sessions: s.sessionsCompleted,
      })),
    });
  } catch (error) {
    console.error("Error fetching streaks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
