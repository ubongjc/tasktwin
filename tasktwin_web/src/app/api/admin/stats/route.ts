import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/admin/stats - Get platform statistics (admin only)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get platform statistics
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      activeSessions,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.room.count({
        where: { status: "COMPLETED" },
      }),
      prisma.room.count({
        where: { status: "ACTIVE" },
      }),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.payment.aggregate({
        where: { status: "succeeded" },
        _sum: { amount: true },
      }),
    ]);

    // Get user growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await prisma.user.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    });

    // Get session growth (last 30 days)
    const sessionGrowth = await prisma.room.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: "COMPLETED",
      },
      _count: true,
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalSessions,
        activeSessions,
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue: (totalRevenue._sum.amount || 0) / 100, // Convert cents to dollars
      },
      growth: {
        users: userGrowth,
        sessions: sessionGrowth,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
