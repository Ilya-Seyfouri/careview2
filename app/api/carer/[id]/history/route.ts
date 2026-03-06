import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const history = await prisma.schedule.findMany({
      where: {
        carer_id: id,
        status: "completed",
      },
      select: {
        id: true,
        start_at: true,
        end_at: true,
        status: true,
        title: true,
        patient: {
          select: {
            id: true,
            full_name: true,
            room: true,
          },
        },
      },
      orderBy: { start_at: "desc" },
      take: 30,
    });

    return NextResponse.json(history);
  } catch (err) {
    console.error("Error fetching history:", err);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
