import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/gdpr/export - Export all user data (GDPR compliant)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        matches: {
          include: {
            room: true,
          },
        },
        recaps: {
          include: {
            room: true,
          },
        },
        streaks: true,
        subscriptions: {
          include: {
            payments: true,
          },
        },
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create comprehensive export
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        streakCount: user.streakCount,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      matches: user.matches.map((match) => ({
        id: match.id,
        roomTopic: match.room.topic,
        status: match.status,
        joinedAt: match.joinedAt,
        completedAt: match.leftAt,
      })),
      recaps: user.recaps.map((recap) => ({
        id: recap.id,
        roomTopic: recap.room.topic,
        text: recap.text,
        approved: recap.user1Approved,
        createdAt: recap.createdAt,
        finalizedAt: recap.finalizedAt,
      })),
      streaks: user.streaks.map((streak) => ({
        date: streak.date,
        sessionsCompleted: streak.sessionsCompleted,
      })),
      subscriptions: user.subscriptions.map((sub) => ({
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        payments: sub.payments.map((payment) => ({
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paidAt,
        })),
      })),
      teams: user.teams.map((member) => ({
        teamName: member.team.name,
        role: member.role,
        joinedAt: member.joinedAt,
      })),
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tasktwin-data-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
