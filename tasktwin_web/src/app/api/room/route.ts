import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const createRoomSchema = z.object({
  topic: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(60).default(25),
  participantIds: z.array(z.string()).length(2),
});

// POST /api/room - Create and start a room
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    // Verify current user is one of the participants
    if (!validatedData.participantIds.includes(userId)) {
      return NextResponse.json(
        { error: "User must be a participant" },
        { status: 400 }
      );
    }

    // Create room and matches in transaction
    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          topic: validatedData.topic,
          description: validatedData.description,
          durationMinutes: validatedData.durationMinutes,
          status: "WAITING",
        },
      });

      const matches = await Promise.all(
        validatedData.participantIds.map((participantId) =>
          tx.match.create({
            data: {
              userId: participantId,
              roomId: room.id,
              status: "MATCHED",
            },
          })
        )
      );

      return { room, matches };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/room - Get current user's active rooms
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matches = await prisma.match.findMany({
      where: {
        userId,
        status: { in: ["MATCHED", "IN_SESSION"] },
      },
      include: {
        room: {
          include: {
            matches: {
              include: {
                user: true,
              },
            },
            checklist: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rooms = matches.map((match) => match.room);

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
