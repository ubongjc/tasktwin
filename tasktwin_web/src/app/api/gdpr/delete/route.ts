import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// DELETE /api/gdpr/delete - Delete all user data (GDPR compliant)
export async function DELETE() {
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

    // Delete all user data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete subscriptions (cascades to payments)
      await tx.subscription.deleteMany({
        where: { userId: user.id },
      });

      // Delete team memberships
      await tx.teamMember.deleteMany({
        where: { userId: user.id },
      });

      // Delete recaps
      await tx.recap.deleteMany({
        where: {
          OR: [{ user1Id: user.id }, { user2Id: user.id }],
        },
      });

      // Delete matches
      await tx.match.deleteMany({
        where: { userId: user.id },
      });

      // Delete streaks
      await tx.streak.deleteMany({
        where: { userId: user.id },
      });

      // Delete match queue entries
      await tx.matchQueue.deleteMany({
        where: { userId: user.id },
      });

      // Delete reports (both filed and received)
      await tx.report.deleteMany({
        where: {
          OR: [{ reporterId: user.id }, { reportedUserId: user.id }],
        },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "All user data has been permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting user data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
