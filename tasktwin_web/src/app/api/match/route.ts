import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const matchRequestSchema = z.object({
  topic: z.string().min(1).max(200),
  intent: z.array(z.string()).min(1),
  preferences: z.record(z.any()).optional(),
});

// POST /api/match - Enter matching queue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = matchRequestSchema.parse(body);

    // Check if user already in queue
    const existing = await prisma.matchQueue.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already in queue" },
        { status: 400 }
      );
    }

    // Create queue entry (expires in 5 minutes)
    const queueEntry = await prisma.matchQueue.create({
      data: {
        userId,
        topic: validatedData.topic,
        intent: validatedData.intent,
        preferences: validatedData.preferences || {},
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // TODO: Trigger matching algorithm via WebSocket/background job

    return NextResponse.json({
      queueId: queueEntry.id,
      estimatedWaitTime: 30, // seconds
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error entering match queue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/match - Leave matching queue
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.matchQueue.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving match queue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/match/status - Check queue status
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queueEntry = await prisma.matchQueue.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!queueEntry) {
      return NextResponse.json({
        status: "not_in_queue",
      });
    }

    // Check if matched
    const match = await prisma.match.findFirst({
      where: {
        userId,
        status: "MATCHED",
      },
      include: {
        room: true,
      },
    });

    if (match) {
      return NextResponse.json({
        status: "matched",
        roomId: match.roomId,
        room: match.room,
      });
    }

    // Calculate position in queue
    const position = await prisma.matchQueue.count({
      where: {
        createdAt: { lt: queueEntry.createdAt },
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({
      status: "waiting",
      queueId: queueEntry.id,
      position: position + 1,
    });
  } catch (error) {
    console.error("Error checking match status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
