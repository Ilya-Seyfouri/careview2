import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const schedules = await prisma.schedule.findMany({
      where: {
        carer_id: id,
        start_at: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        id: true,
        start_at: true,
        end_at: true,
        status: true,
        title: true,
        required_tasks: true,
        patient: {
          select: {
            id: true,
            full_name: true,
            room: true,
            status: true,
          },
        },
      },
      orderBy: { start_at: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (err) {
    console.error("Error fetching carer schedules:", err);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}
