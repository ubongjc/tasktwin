import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const createRecapSchema = z.object({
  roomId: z.string(),
  text: z.string().min(10).max(2000),
});

// POST /api/recap - Create session recap
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRecapSchema.parse(body);

    // Verify user is a participant
    const match = await prisma.match.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: validatedData.roomId,
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Not authorized for this room" },
        { status: 403 }
      );
    }

    // Check if recap already exists
    const existingRecap = await prisma.recap.findUnique({
      where: { roomId: validatedData.roomId },
    });

    if (existingRecap) {
      return NextResponse.json(
        { error: "Recap already exists for this room" },
        { status: 400 }
      );
    }

    // Get partner ID
    const matches = await prisma.match.findMany({
      where: { roomId: validatedData.roomId },
    });

    const partner = matches.find((m) => m.userId !== userId);

    const recap = await prisma.recap.create({
      data: {
        roomId: validatedData.roomId,
        text: validatedData.text,
        user1Id: userId,
        user2Id: partner?.userId,
        user1Approved: true, // Creator automatically approves
      },
    });

    return NextResponse.json({ recap }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating recap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/recap - Get user's recaps
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const recaps = await prisma.recap.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        room: true,
        user1: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.recap.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    return NextResponse.json({
      recaps,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching recaps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
