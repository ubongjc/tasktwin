import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/stats - Get user statistics
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Total sessions
    const totalSessions = await prisma.match.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
    });

    // Total minutes (assuming 25 min per session)
    const totalMinutes = totalSessions * 25;

    // Get best streak
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

    // Average sessions per week (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const recentStreaks = await prisma.streak.findMany({
      where: {
        userId: user.id,
        date: {
          gte: twelveWeeksAgo,
        },
      },
    });

    const totalRecentSessions = recentStreaks.reduce(
      (sum, s) => sum + s.sessionsCompleted,
      0
    );
    const averageSessionsPerWeek = totalRecentSessions / 12;

    return NextResponse.json({
      totalSessions,
      totalMinutes,
      currentStreak: user.streakCount,
      bestStreak,
      averageSessionsPerWeek: Math.round(averageSessionsPerWeek * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
