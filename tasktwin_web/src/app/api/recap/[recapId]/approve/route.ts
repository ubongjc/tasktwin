import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// POST /api/recap/[recapId]/approve - Approve a recap
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recapId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recapId } = await params;

    const recap = await prisma.recap.findUnique({
      where: { id: recapId },
    });

    if (!recap) {
      return NextResponse.json({ error: "Recap not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (recap.user1Id !== userId && recap.user2Id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to approve this recap" },
        { status: 403 }
      );
    }

    // Check if already approved
    if (
      (recap.user1Id === userId && recap.user1Approved) ||
      (recap.user2Id === userId && recap.user2Approved)
    ) {
      return NextResponse.json(
        { error: "Already approved" },
        { status: 400 }
      );
    }

    // Update approval
    const isUser1 = recap.user1Id === userId;
    const updatedRecap = await prisma.recap.update({
      where: { id: recapId },
      data: {
        ...(isUser1
          ? { user1Approved: true }
          : { user2Approved: true }),
        // If both approved, set finalized timestamp
        ...((!isUser1 && recap.user1Approved) || (isUser1 && recap.user2Approved)
          ? { finalizedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json({ recap: updatedRecap });
  } catch (error) {
    console.error("Error approving recap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
